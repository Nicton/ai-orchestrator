/**
 * Механизм инкрементальной синхронизации базы знаний (delta sync).
 * Тянет всё, что СОЗДАНО/ИЗМЕНЕНО с момента последнего синка каждого источника до «сейчас»,
 * формирует дельта-отчёт и (далее) запускает анализ + встраивание в спеки.
 *
 * Источники:
 *   - git-code, autotests        → AUTO (работает сейчас, локально)
 *   - confluence, jira           → MCP Atlassian (подключён) — адаптер
 *   - slack                      → MCP Slack (нужно подключить) — адаптер
 *   - presentations              → MCP Google Drive ИЛИ ручная загрузка — адаптер
 *   - test-cases (Qase)          → ручная загрузка — адаптер
 *
 * Usage:
 *   node scripts/sync/sync.mjs                 # дельта по всем источникам, отчёт, состояние НЕ двигаем
 *   node scripts/sync/sync.mjs --source git-code
 *   node scripts/sync/sync.mjs --apply         # продвинуть lastSyncAt обработанных AUTO-источников
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

// Atlassian REST (Confluence + Jira) — тот же токен, что у публикатора; MCP не требуется.
const ATL_HOST = 'shiptify.atlassian.net';
const ATL_EMAIL = 'aleh.asmalouski@shiptify.com';
function atlToken() {
  if (process.env.ATL_TOKEN) return process.env.ATL_TOKEN;
  try { return fs.readFileSync(path.resolve('scripts/confluence-publish.mjs'), 'utf8').match(/const TOKEN\s*=\s*'([^']+)'/)?.[1]; } catch { return null; }
}
function atlGet(apiPath) {
  const token = atlToken();
  if (!token) return Promise.resolve({ _error: 'no Atlassian token' });
  const auth = Buffer.from(`${ATL_EMAIL}:${token}`).toString('base64');
  return new Promise((resolve) => {
    https.request({ hostname: ATL_HOST, path: apiPath, headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } }, (r) => {
      let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ _error: `HTTP ${r.statusCode}` }); } });
    }).on('error', (e) => resolve({ _error: String(e.message) })).end();
  });
}

const STATE_PATH = path.resolve('scripts/sync/sync-state.json');
const REPORT_DIR = path.resolve('workspaces/documentation/product/specs/sync');
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--source=')) || '').split('=')[1] || (args.includes('--source') ? args[args.indexOf('--source') + 1] : null);
const apply = args.includes('--apply');
const now = new Date().toISOString();

const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));

// ── AUTO-коннектор: git (коммиты + изменённые файлы с lastSyncAt) ──────────────
function gitDelta(repoRel, since) {
  const cwd = path.resolve(repoRel);
  if (!fs.existsSync(path.join(cwd, '.git')) && !fs.existsSync(cwd)) return { ok: false, note: 'нет репозитория' };
  try {
    const log = execSync(`git log --since="${since}" --pretty=format:"%h|%ad|%an|%s" --date=iso`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const commits = log ? log.split('\n').map((l) => { const [h, d, a, ...s] = l.split('|'); return { h, d, a, s: s.join('|') }; }) : [];
    const filesRaw = execSync(`git log --since="${since}" --name-only --pretty=format:`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const files = [...new Set(filesRaw.split('\n').map((s) => s.trim()).filter(Boolean))];
    return { ok: true, commits, files };
  } catch (e) { return { ok: false, note: String(e.message).slice(0, 120) }; }
}

// ── Реестр коннекторов ─────────────────────────────────────────────────────────
const connectors = {
  'git-code': (s) => {
    const parts = (s.repos || ['.']).map((r) => ({ repo: r, ...gitDelta(r, s.lastSyncAt) }));
    const totalCommits = parts.reduce((a, p) => a + (p.commits ? p.commits.length : 0), 0);
    const totalFiles = parts.reduce((a, p) => a + (p.files ? p.files.length : 0), 0);
    return { status: 'ok', summary: `${totalCommits} коммитов, ${totalFiles} изменённых файлов`, detail: parts, advance: true };
  },
  autotests: (s) => {
    // индекс автотестов — пересобирается отдельным index-скриптом; здесь только сигнал об изменениях файла индекса
    const idx = path.resolve('docs/qa/autotests-index.json');
    const changed = fs.existsSync(idx) && fs.statSync(idx).mtime.toISOString() > s.lastSyncAt;
    return { status: 'ok', summary: changed ? 'индекс автотестов обновлён после lastSync' : 'без изменений индекса', advance: true };
  },
  confluence: async (s) => {
    const since = s.lastSyncAt.slice(0, 10);
    const cql = encodeURIComponent(`lastmodified >= "${since} 00:00" order by lastmodified desc`);
    const r = await atlGet(`/wiki/rest/api/content/search?cql=${cql}&limit=100&expand=version,space`);
    if (r._error) return { status: 'error', summary: `Confluence API: ${r._error}` };
    const items = (r.results || []).map((p) => ({ id: p.id, title: p.title, space: p.space?.key, at: p.version?.when }));
    return { status: 'ok', summary: `${items.length} изменённых страниц (с ${since})`, detail: items, advance: true };
  },
  jira: async (s) => {
    const since = s.lastSyncAt.slice(0, 10);
    const jql = encodeURIComponent(`updated >= "${since}" order by updated desc`);
    const r = await atlGet(`/rest/api/3/search?jql=${jql}&maxResults=100&fields=summary,updated,status,created`);
    if (r._error) return { status: 'error', summary: `Jira API: ${r._error}` };
    const items = (r.issues || []).map((i) => ({ key: i.key, summary: i.fields?.summary, status: i.fields?.status?.name, updated: i.fields?.updated, created: i.fields?.created }));
    const created = items.filter((i) => i.created && i.created.slice(0, 10) >= since).length;
    return { status: 'ok', summary: `${r.total ?? items.length} задач изменено (новых ~${created}, с ${since})`, detail: items.slice(0, 50), advance: true };
  },
  slack: () => ({ status: 'needs-mcp', summary: 'Подключить MCP Slack → conversations.history с oldest=since по нужным каналам' }),
  presentations: () => ({ status: 'needs-mcp', summary: 'Подключить MCP Google Drive (или ручная загрузка) → файлы с modifiedTime >= since' }),
  'test-cases': () => ({ status: 'manual', summary: 'Qase: ручная выгрузка JSON → положить в docs/qa/ (авто-API при наличии токена)' }),
};

// ── Запуск ──────────────────────────────────────────────────────────────────────
const results = {};
for (const [key, s] of Object.entries(state.sources)) {
  if (only && only !== key) continue;
  const fn = connectors[key];
  results[key] = fn ? await fn(s) : { status: 'unknown', summary: 'нет коннектора' };
}

// ── Дельта-отчёт ─────────────────────────────────────────────────────────────────
fs.mkdirSync(REPORT_DIR, { recursive: true });
const stamp = now.replace(/[:.]/g, '-');
let out = `---\nsource_type: spec\n---\n# Дельта-синк ${now}\n\n`;
out += `> Окно: с последнего синка каждого источника → ${now}. Baseline: ${state.baseline}.\n> Последнее полное обновление: ${state.lastFullUpdate || '— (ещё не было)'}.\n\n`;
out += `## Источники\n| Источник | Тип | lastSyncAt | Статус | Дельта |\n|---|---|---|---|---|\n`;
for (const [key, s] of Object.entries(state.sources)) {
  if (only && only !== key) continue;
  const r = results[key];
  out += `| ${s.label} | ${s.kind} | ${s.lastSyncAt} | ${r.status} | ${r.summary} |\n`;
}
// git-детализация
const g = results['git-code'];
if (g && g.detail) {
  out += `\n## Кодовая база — детализация\n`;
  for (const p of g.detail) {
    if (!p.ok) { out += `\n### ${p.repo} — ${p.note}\n`; continue; }
    out += `\n### ${p.repo}: ${p.commits.length} коммитов, ${p.files.length} файлов\n`;
    out += p.commits.slice(0, 20).map((c) => `- \`${c.h}\` ${c.d.slice(0, 10)} ${c.a}: ${c.s}`).join('\n');
    if (p.commits.length > 20) out += `\n- … ещё ${p.commits.length - 20}`;
  }
}
// Confluence / Jira детализация
const cf = results['confluence'];
if (cf && cf.detail && cf.detail.length) {
  out += `\n## Confluence — изменённые страницы (${cf.detail.length})\n`;
  out += cf.detail.slice(0, 30).map((p) => `- [${p.space || '?'}] ${p.title} (id ${p.id}, ${(p.at || '').slice(0, 10)})`).join('\n');
}
const ji = results['jira'];
if (ji && ji.detail && ji.detail.length) {
  out += `\n\n## Jira — изменённые задачи (${ji.detail.length})\n`;
  out += ji.detail.slice(0, 30).map((i) => `- ${i.key} [${i.status}] ${i.summary} (upd ${(i.updated || '').slice(0, 10)})`).join('\n');
}
out += `\n\n## Стадии анализа (что запускается над дельтой)\n`;
out += `1. **Извлечение** нового/изменённого из каждого источника (выше).\n`;
out += `2. **Кросс-язычный анализ** (#8) — нормализация EN/FR/RU.\n`;
out += `3. **Детект перекрытий/противоречий** (#6) — новые требования vs существующие спеки.\n`;
out += `4. **Supersede**: устаревшие требования зачёркиваются (~~текст~~) + «не актуально из-за <new>, дата» + ссылка; ниже — актуальные.\n`;
out += `5. **Запись/обновление спек** (#3) с заземлением на код + **линковка тестов** (#7).\n`;
out += `6. **Фиксация даты** последнего обновления в sync-state.json.\n`;
out += `\n---\n\n## 🔗 Граф-метаданные\n- **id:** \`specs.sync.delta.${stamp}\`\n- **type:** spec · **domain:** TMS · **status:** partial\n- **confluence:** — · **repo:** \`specs/sync/SYNC-DELTA-${stamp}.md\`\n- **modules:** TMS\n- **requirements:** —\n`;
const reportFile = path.join(REPORT_DIR, `SYNC-DELTA-${stamp}.md`);
fs.writeFileSync(reportFile, out);

// ── Продвижение состояния (только с --apply, только AUTO-источники с advance) ────
if (apply) {
  for (const [key, r] of Object.entries(results)) if (r.advance) state.sources[key].lastSyncAt = now;
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

console.log(`Sync delta → ${path.relative(process.cwd(), reportFile)}`);
for (const [key, r] of Object.entries(results)) console.log(`  [${r.status}] ${state.sources[key].label}: ${r.summary}`);
if (apply) console.log('state advanced (lastSyncAt = now) for AUTO sources'); else console.log('(dry — состояние не двигалось; для продвижения: --apply)');
