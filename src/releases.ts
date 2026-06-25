import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from './config.js';
import { runRolePrompt } from './llm.js';
import { requireAuth } from './auth.js';
import { prisma } from './db.js';

// ---------------------------------------------------------------------------
// Release Notes — engine + API. Implements skills/31-release-notes-writer:
// baseline = git delta <last prod tag>..origin/develop across the prod repos
// (point of reference), aggregated commits→Jira tasks→modules, then THREE
// audience reports (QA / Devs / Business) via the LLM. Saved with history,
// shareable links, per-report copy, and on-demand cached translation.
// Spec: docs/specs/release-notes-searchify-TZ.md.
// ---------------------------------------------------------------------------
function jiraConfig() {
  const baseUrl = String(process.env.JIRA_BASE_URL || 'https://shiptify.atlassian.net').replace(/\/$/, '');
  const email = String(process.env.JIRA_EMAIL || '').trim();
  const token = String(process.env.JIRA_API_TOKEN || '').trim();
  return { baseUrl, email, token, enabled: !!(baseUrl && email && token) };
}
async function jiraFetch(method: string, apiPath: string) {
  const { baseUrl, email, token } = jiraConfig();
  const res = await fetch(`${baseUrl}${apiPath}`, {
    method, headers: { Authorization: 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64'), Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Jira ${res.status}`);
  return res.json();
}

const WORKSPACES = path.resolve(process.cwd(), 'workspaces');
const GIT = "git -c safe.directory='*'";
function shp(cmd: string, cwd: string, timeoutMs = 90000): Promise<string> {
  return new Promise((resolve) => exec(cmd, { cwd, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
    (err, stdout) => resolve(err ? '' : String(stdout))));
}

// Prod repos that carry releasable changes (skill: "Состав релиза"). Only those
// actually present as git clones in workspaces/ are used.
const PROD_REPOS = ['backend', 'frontend-mono', 'frontend', 'mini-apps', 'back-office', 'admin-app', 'public-api', 'public-api-docs', 'integrations', 'ups', 'brinks', 'generate', 'emailing', 'notifications', 'microservices', 'migrations', 'migrations-bi'];
function availableRepos(): string[] {
  return PROD_REPOS.filter((r) => { try { return fs.existsSync(path.join(WORKSPACES, r, '.git')); } catch { return false; } });
}

const KEY_RE = /[A-Z][A-Z0-9]+-\d+/g;
function commitType(subject: string): string {
  const m = subject.match(/^(\w+)(\(|:|!)/);
  return m ? m[1].toLowerCase() : 'other';
}

type Commit = { repo: string; sha: string; author: string; date: string; subject: string; type: string; keys: string[] };

// Per-repo delta since the last prod tag (or a given `from`) up to origin/<default>.
const isDateStr = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

async function collectBaseline(fromOverride: string | null, onStage?: (m: string) => void) {
  const repos = availableRepos();
  const repoInfo: Array<{ repo: string; from: string; fromDate: string; to: string; commits: number; files: string[] }> = [];
  const commits: Commit[] = [];
  for (const repo of repos) {
    const cwd = path.join(WORKSPACES, repo);
    onStage?.(`⬇️ ${repo}: fetch + delta…`);
    await shp(`${GIT} fetch --quiet --all --tags`, cwd, 120000);
    // default branch (develop preferred)
    let to = 'origin/develop';
    if (!(await shp(`${GIT} rev-parse --verify --quiet origin/develop`, cwd, 15000)).trim()) {
      to = (await shp(`${GIT} rev-parse --verify --quiet origin/master`, cwd, 15000)).trim() ? 'origin/master' : 'origin/HEAD';
    }
    let range = '';
    let fromLabel = '';
    let fromDate = '';
    if (fromOverride && isDateStr(fromOverride)) {
      // commits since a chosen date → take a larger span
      let base = (await shp(`${GIT} rev-list -1 --before="${fromOverride} 00:00" ${to}`, cwd, 20000)).trim();
      if (!base) base = ''; // repo younger than the date → include everything up to `to`
      range = base ? `${base}..${to}` : `${to}~200..${to}`;
      fromLabel = `since ${fromOverride}`;
      fromDate = fromOverride;
    } else {
      let from = fromOverride || '';
      if (!from) {
        const tags = (await shp(`${GIT} tag --sort=-creatordate`, cwd, 20000)).split('\n').map((s) => s.trim()).filter((s) => /^v[0-9]/.test(s));
        from = tags[0] || '';
      }
      range = from ? `${from}..${to}` : `${to}~80..${to}`;
      fromLabel = from || '(last 80)';
      if (from) fromDate = (await shp(`${GIT} log -1 --format=%ad --date=short ${from}`, cwd, 20000)).trim();
    }
    const log = await shp(`${GIT} log ${range} --no-merges --pretty=%H%x09%an%x09%ad%x09%s --date=short`, cwd, 60000);
    const lines = log.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
      const [sha, author, date, ...rest] = l.split('\t');
      const subject = rest.join('\t');
      if (!subject) continue;
      commits.push({ repo, sha: (sha || '').slice(0, 9), author: author || '', date: date || '', subject, type: commitType(subject), keys: subject.match(KEY_RE) || [] });
    }
    const files = (await shp(`${GIT} diff --name-only ${range}`, cwd, 60000)).split('\n').map((s) => s.trim()).filter(Boolean);
    repoInfo.push({ repo, from: fromLabel, fromDate, to, commits: lines.length, files });
  }
  // "Last release / cut" date = the most recent baseline (tag/date) across repos.
  const dates = repoInfo.map((r) => r.fromDate).filter(Boolean).sort();
  const baselineDate = dates.length ? dates[dates.length - 1] : '';
  return { repos: repoInfo, commits, baselineDate };
}

// commits → tasks (grouped by Jira key); commits without a key → "other".
function aggregateTasks(commits: Commit[]) {
  const tasks = new Map<string, { key: string; repos: Set<string>; authors: Set<string>; types: Set<string>; subjects: string[] }>();
  const other: Commit[] = [];
  for (const c of commits) {
    if (!c.keys.length) { other.push(c); continue; }
    for (const key of c.keys) {
      if (!tasks.has(key)) tasks.set(key, { key, repos: new Set(), authors: new Set(), types: new Set(), subjects: [] });
      const t = tasks.get(key)!;
      t.repos.add(c.repo); if (c.author) t.authors.add(c.author); t.types.add(c.type);
      if (t.subjects.length < 4) t.subjects.push(c.subject);
    }
  }
  return { tasks, other };
}

async function enrichJira(keys: string[], onStage?: (m: string) => void): Promise<Map<string, any>> {
  const out = new Map<string, any>();
  if (!jiraConfig().enabled || !keys.length) return out;
  const uniq = [...new Set(keys)];
  onStage?.(`📥 Jira: ${uniq.length} задач…`);
  for (let i = 0; i < uniq.length; i += 50) {
    const batch = uniq.slice(i, i + 50);
    const jql = `key in (${batch.join(',')})`;
    try {
      const data = await jiraFetch('GET', `/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,issuetype,status,assignee,project,components,labels&maxResults=50`);
      for (const it of data?.issues || []) {
        out.set(it.key, {
          summary: it.fields?.summary || '', type: it.fields?.issuetype?.name || '', status: it.fields?.status?.name || '',
          assignee: it.fields?.assignee?.displayName || '', project: it.fields?.project?.key || (it.key.split('-')[0]),
          components: (it.fields?.components || []).map((c: any) => c.name), labels: it.fields?.labels || [],
        });
      }
    } catch { /* batch failed — keep going */ }
  }
  return out;
}

// File-path → product module (skill mapping).
function moduleOf(repo: string, file: string): string {
  const f = file.toLowerCase();
  if (repo === 'migrations' || repo === 'migrations-bi') return 'DB / migrations';
  if (repo === 'backend' && /app\/models\//.test(f)) return 'DB / models';
  if (repo === 'backend' && /app\/(controllers|routes)\//.test(f)) return 'Backend API';
  if (repo === 'backend' && /app\/services\//.test(f)) return 'Backend services';
  if (repo === 'back-office') return 'Back-Office';
  if (repo === 'admin-app') return 'Admin BO';
  if (repo === 'public-api' || repo === 'public-api-docs') return 'Public API';
  if (repo === 'mini-apps') return 'DOCK / Slotify';
  if (/integrations|ups|brinks/.test(repo)) return 'Integrations';
  if (repo === 'notifications' || repo === 'emailing') return 'Notifications / Email';
  if (repo === 'generate') return 'Attachments / CMR';
  if (repo === 'frontend-mono' || repo === 'frontend') { const m = file.match(/app\/([a-z0-9_-]+)\//i); return 'Frontend' + (m ? ` / ${m[1]}` : ''); }
  return repo;
}
function codeImpact(baseline: { repos: any[] }) {
  const modules = new Map<string, number>();
  const dbFiles: string[] = [];
  const frontendAreas = new Set<string>();
  let migrationsTouched = false;
  for (const r of baseline.repos) {
    for (const file of r.files as string[]) {
      const mod = moduleOf(r.repo, file);
      modules.set(mod, (modules.get(mod) || 0) + 1);
      if (r.repo === 'migrations' || r.repo === 'migrations-bi') { migrationsTouched = true; if (dbFiles.length < 40) dbFiles.push(`${r.repo}/${file}`); }
      if (r.repo === 'backend' && /app\/models\//.test(file.toLowerCase())) { if (dbFiles.length < 40) dbFiles.push(`${r.repo}/${file}`); }
      if ((r.repo === 'frontend-mono' || r.repo === 'frontend') && mod.startsWith('Frontend /')) frontendAreas.add(mod);
    }
  }
  return { modules: [...modules.entries()].sort((a, b) => b[1] - a[1]), dbFiles, frontendAreas: [...frontendAreas], migrationsTouched };
}

// Compact structured digest fed to the report prompts.
function buildDigest(baseline: any, tasksMap: Map<string, any>, other: Commit[], jira: Map<string, any>, impact: any, releaseId: string) {
  const repoHdr = baseline.repos.map((r: any) => `${r.repo}@${r.from}→${r.to.replace('origin/', '')} (${r.commits} commits, ${r.files.length} files)`).join('\n');
  const taskLines: string[] = [];
  for (const t of tasksMap.values()) {
    const j = jira.get(t.key) || {};
    taskLines.push(`- ${t.key} [${j.type || [...t.types][0] || '?'}/${j.status || '?'}] proj=${j.project || t.key.split('-')[0]} repos=${[...t.repos].join(',')} assignee=${j.assignee || [...t.authors][0] || '?'}${j.components?.length ? ` comp=${j.components.join('/')}` : ''} — ${j.summary || t.subjects[0] || ''}`);
  }
  const otherLines = other.slice(0, 40).map((c) => `- [${c.repo}] ${c.author}: ${c.subject}`);
  const moduleLines = impact.modules.map(([m, n]: [string, number]) => `- ${m}: ${n} файлов`);
  return [
    `RELEASE ${releaseId}`,
    baseline.baselineDate ? `Baseline (last release) date: ${baseline.baselineDate}` : '',
    `Repos (baseline → develop):\n${repoHdr}`,
    `\nTASKS (commits aggregated by Jira key; ${tasksMap.size}):\n${taskLines.join('\n') || '(none)'}`,
    other.length ? `\nOTHER commits without a Jira key (${other.length}):\n${otherLines.join('\n')}` : '',
    `\nCODE IMPACT:\nModules touched (by changed-file count):\n${moduleLines.join('\n')}`,
    `DB changes: ${impact.migrationsTouched ? 'YES (migrations touched)' : 'maybe (check models)'}; files:\n${impact.dbFiles.join('\n') || '(none detected)'}`,
    `Frontend areas: ${impact.frontendAreas.join(', ') || '(none)'}`,
  ].filter(Boolean).join('\n');
}

const LANG_NAME: Record<string, string> = { fr: 'French', en: 'English', ru: 'Russian' };
const AUD_PROMPT: Record<string, string> = {
  qa: `Audience: QA / TESTERS. Produce a Markdown report that tells testers exactly what to verify:
## Изменённые разделы — by product module, with the Jira keys touching each.
## Затронутые фронт-роуты / экраны — derived from frontend file areas.
## Изменения БД — tables/columns/migrations touched (from DB files); call out destructive/migration risk.
## 🔴 Обязательный регресс — prioritized list of areas to regress (risk × user reach).
## ⚠️ Зоны вероятных дефектов — apply Shiptify bug heuristics (ACL parity listing-vs-dropdown, row multiplication in required hasMany JOIN, front↔back contract, legacy column vs new source, falsy fallbacks, dispatch fallback, missing indexes) + structural signals (large diff, shared/core helpers, ACL files, cross-module). Justify each from the digest; mark unverified with "verify".`,
  dev: `Audience: DEVELOPERS (contribution view). Produce a Markdown report grouped BY PERSON so everyone sees their contribution:
## Вклад по разработчикам — for each assignee/author: their tasks in this release (Jira key + summary + repos/feature).
## Счётчики — tasks & commits per person, split by type (feat/fix/other).
## Кросс-репные фичи — tasks that span multiple repos (e.g. backend+frontend-mono).
Neutral tone, no rankings. Include an "Other (no Jira key)" section so nothing is lost.`,
  business: `Audience: BUSINESS. Produce a Markdown report conveying VALUE, no tech jargon, no task numbers in the body (links may go at the end):
## Что стало лучше — by product module: the customer pain closed / capability added.
## Для каких клиентов — map value to client types: shipper / carrier / forwarder / dock (warehouse) / back-office / public-API integrators.
## Где выросла ценность продукта — new capabilities, less manual work, reliability.
Derive value from the task/module meaning; never invent metrics or percentages.`,
};

async function genReport(audience: 'qa' | 'dev' | 'business', digest: string, lang: string, onDelta?: (t: string) => void) {
  const langName = LANG_NAME[lang] || 'Russian';
  const prompt = `You are assembling Shiptify PROD release notes from a code/Jira delta (the commits are only the point of reference — turn them into commits→tasks→modules→value). Write in ${langName}, clean Markdown, ready to paste. Ground every statement in the digest; do not invent tasks, tables or metrics. Start with a short one-line header line for the release.

${AUD_PROMPT[audience]}

=== RELEASE DIGEST (source of truth) ===
${digest.slice(0, 22000)}`;
  const r = await runRolePrompt(`release_notes.${audience}`, prompt, config.answerModel, onDelta);
  if (!r.text || !r.text.trim()) throw new Error(`LLM returned empty ${audience} report`);
  return r.text.trim();
}

async function translateReport(bodyMd: string, lang: string, onDelta?: (t: string) => void) {
  const langName = LANG_NAME[lang] || lang;
  const prompt = `Translate the following release-notes Markdown into ${langName}. Preserve the Markdown structure, headings, lists and tables exactly. Do NOT translate code, file paths, identifiers, Jira keys (e.g. TMS-1234), repo names, or proper nouns. Output ONLY the translated Markdown.\n\n${bodyMd.slice(0, 24000)}`;
  const r = await runRolePrompt('release_notes.translate', prompt, config.answerModel, onDelta);
  if (!r.text || !r.text.trim()) throw new Error('translation failed');
  return r.text.trim();
}

export async function registerReleasesApi(app: FastifyInstance) {
  app.get('/api/releases/config', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    return reply.send({ jiraEnabled: jiraConfig().enabled, repos: availableRepos() });
  });

  const genSchema = z.object({ from: z.string().max(120).optional(), lang: z.enum(['fr', 'en', 'ru']).optional() });

  app.post('/api/releases/generate/stream', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = genSchema.safeParse(req.body || {});
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const lang = parsed.data.lang || 'ru';
    const from = parsed.data.from?.trim() || null;

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event: string, data: any) => { try { raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* gone */ } };
    const ping = setInterval(() => { try { raw.write(': ping\n\n'); } catch { /* noop */ } }, 15000);
    const stage = (m: string) => send('stage', { msg: m });

    try {
      const repos = availableRepos();
      if (!repos.length) { send('error', { message: 'Нет доступных git-репозиториев в workspaces/ (нужны клоны прод-реп).' }); return; }
      stage(`🔎 Репозиториев: ${repos.length} — собираю дельту…`);
      const baseline = await collectBaseline(from, stage);
      stage('🧩 Агрегация коммитов → задачи…');
      const { tasks, other } = aggregateTasks(baseline.commits);
      const jira = await enrichJira([...tasks.keys()], stage);
      stage('🧪 Анализ влияния по коду…');
      const impact = codeImpact(baseline);
      const releaseId = new Date().toISOString().slice(0, 10);
      const digest = buildDigest(baseline, tasks, other, jira, impact, releaseId);

      const reports: Array<{ audience: string; bodyMd: string }> = [];
      for (const aud of ['qa', 'dev', 'business'] as const) {
        stage(`🤖 Отчёт «${aud.toUpperCase()}» (${config.answerModel})…`);
        let bodyMd: string;
        try {
          bodyMd = await genReport(aud, digest, lang, (t) => send('delta', { audience: aud, text: t }));
        } catch (e: any) {
          // не валим весь прогон из-за одного отчёта (таймаут/пустой ответ LLM)
          const msg = String(e?.message || e).slice(0, 200);
          stage(`⚠️ Отчёт «${aud.toUpperCase()}» не сгенерирован: ${msg}`);
          bodyMd = `> ⚠️ Этот отчёт не удалось сгенерировать автоматически (${msg}).\n>\n> Нажмите «Сгенерировать заново» — остальные отчёты ниже доступны.`;
        }
        reports.push({ audience: aud, bodyMd });
        send('report', { audience: aud, bodyMd });
      }

      const fromRefs: Record<string, string> = {}; const toRefs: Record<string, string> = {};
      for (const r of baseline.repos) { fromRefs[r.repo] = r.from; toRefs[r.repo] = r.to; }
      const note = await prisma.releaseNote.create({
        data: {
          createdById: user.id, createdBy: user.name, releaseId, title: `Release ${releaseId}`,
          fromRefs, toRefs,
          baseline: { baselineDate: baseline.baselineDate, repos: baseline.repos.map((r: any) => ({ repo: r.repo, from: r.from, fromDate: r.fromDate, to: r.to, commits: r.commits, files: r.files.length })), taskCount: tasks.size, otherCount: other.length, tasks: [...tasks.values()].slice(0, 200).map((t) => ({ key: t.key, repos: [...t.repos], summary: (jira.get(t.key) || {}).summary || t.subjects[0] || '' })) },
          reports: { create: reports.map((r) => ({ audience: r.audience, lang, bodyMd: r.bodyMd })) },
        },
        include: { reports: true },
      });
      send('result', {
        id: note.id, releaseId, lang,
        baseline: note.baseline,
        reports: note.reports.map((r) => ({ id: r.id, audience: r.audience, lang: r.lang, bodyMd: r.bodyMd })),
      });
      send('done', {});
    } catch (e: any) {
      send('error', { message: String(e?.message || e).slice(0, 250) });
    } finally {
      clearInterval(ping);
      try { raw.end(); } catch { /* noop */ }
    }
  });

  app.get('/api/releases', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const rows = await prisma.releaseNote.findMany({
      orderBy: { createdAt: 'desc' }, take: 100,
      select: { id: true, releaseId: true, title: true, createdAt: true, createdBy: true },
    });
    return reply.send({ items: rows });
  });

  app.get('/api/releases/:id', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const note = await prisma.releaseNote.findUnique({
      where: { id: String(req.params.id) },
      include: { reports: { include: { translations: { select: { lang: true } } } } },
    });
    if (!note) return reply.code(404).send({ error: 'not found' });
    return reply.send({
      id: note.id, releaseId: note.releaseId, title: note.title, createdBy: note.createdBy, createdAt: note.createdAt,
      baseline: note.baseline, fromRefs: note.fromRefs, toRefs: note.toRefs,
      reports: note.reports.map((r) => ({ id: r.id, audience: r.audience, lang: r.lang, bodyMd: r.bodyMd, translations: r.translations.map((t) => t.lang) })),
    });
  });

  // Report in a given language — translate on-demand and cache.
  app.get('/api/releases/report/:reportId', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const lang = String(req.query?.lang || '').trim();
    const report = await prisma.releaseReport.findUnique({ where: { id: String(req.params.reportId) } });
    if (!report) return reply.code(404).send({ error: 'not found' });
    if (!lang || lang === report.lang) return reply.send({ id: report.id, audience: report.audience, lang: report.lang, bodyMd: report.bodyMd, original: true });
    const cached = await prisma.releaseReportTranslation.findUnique({ where: { reportId_lang: { reportId: report.id, lang } } });
    if (cached) return reply.send({ id: report.id, audience: report.audience, lang, bodyMd: cached.bodyMd, original: false });
    if (!['fr', 'en', 'ru'].includes(lang)) return reply.code(400).send({ error: 'unsupported lang' });
    let translated: string;
    try { translated = await translateReport(report.bodyMd, lang); }
    catch (e: any) { return reply.code(502).send({ error: String(e?.message || e).slice(0, 200) }); }
    await prisma.releaseReportTranslation.create({ data: { reportId: report.id, lang, bodyMd: translated } }).catch(() => {});
    return reply.send({ id: report.id, audience: report.audience, lang, bodyMd: translated, original: false });
  });
}
