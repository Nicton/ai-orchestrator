/**
 * #1 — Калибровка готовности Searchify к поддержке.
 * Прогоняет список вопросов через /api/knowledge/ask и классифицирует ответы:
 *   ANSWERED (по существу) / SPECULATIVE (режим додумывания) / NO-DATA (нет ответа).
 * Печатает таблицу + сводную метрику и пишет CALIBRATION-REPORT.md.
 *
 * Запуск (креды из окружения, чтобы не светить):
 *   BASE_URL=https://searchify.asmalouski.com \
 *   SF_EMAIL=... SF_PASSWORD=... \
 *   node scripts/calibrate.mjs [questionsFile]
 * На сервере удобно брать креды из контейнера:
 *   SF_EMAIL=$(docker exec ...-app-1 sh -lc 'printf %s "$ADMIN_EMAIL"') ...
 */
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'https://searchify.asmalouski.com';
const EMAIL = process.env.SF_EMAIL;
const PASSWORD = process.env.SF_PASSWORD;
const qFile = process.argv[2] || path.resolve('scripts/calibration-questions.json');
if (!EMAIL || !PASSWORD) { console.error('Set SF_EMAIL and SF_PASSWORD env vars'); process.exit(1); }

const NO_DATA = ['does not contain', 'not contain', 'insufficient', 'no information', 'cannot answer',
  'unable to answer', 'only the header', 'only its title', 'only a one-line',
  'нет данных', 'не содержит', 'недостаточно', 'не могу ответить', 'нет информации', 'не удалось найти'];

async function login() {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  if (!cookie) throw new Error(`login failed (${r.status})`);
  return cookie;
}
async function ask(cookie, q) {
  const r = await fetch(`${BASE}/api/knowledge/ask`, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ question: q, inputMode: 'text' }),
  });
  const d = await r.json();
  return { answer: d.answer || '', mode: d.answerMode, confidence: d.confidence };
}
function classify(res) {
  if (res.mode === 'speculative') return 'SPECULATIVE';
  const a = (res.answer || '').toLowerCase();
  if (!a || NO_DATA.some((m) => a.includes(m))) return 'NO-DATA';
  return 'ANSWERED';
}

const questions = JSON.parse(fs.readFileSync(qFile, 'utf8'));
const cookie = await login();
const rows = [];
for (const item of questions) {
  try {
    const res = await ask(cookie, item.q);
    rows.push({ area: item.area, q: item.q, verdict: classify(res), conf: res.confidence, len: (res.answer || '').length });
  } catch (e) {
    rows.push({ area: item.area, q: item.q, verdict: 'ERROR', conf: 0, len: 0 });
  }
}

const n = rows.length;
const answered = rows.filter((r) => r.verdict === 'ANSWERED').length;
const spec = rows.filter((r) => r.verdict === 'SPECULATIVE').length;
const nodata = rows.filter((r) => r.verdict === 'NO-DATA').length;
const pct = (x) => Math.round((x / n) * 100);
const esc = (s) => String(s).replace(/\|/g, '\\|');

let out = `---\nsource_type: spec\n---\n# Калибровка готовности Searchify к поддержке\n\n`;
out += `> Авто-прогон ${n} вопросов через \`/api/knowledge/ask\`. Запуск: \`node scripts/calibrate.mjs\`.\n`;
out += `> Дата: ${new Date().toISOString()}\n\n`;
out += `**Готовность:** ANSWERED ${answered}/${n} (${pct(answered)}%) · SPECULATIVE ${spec} (${pct(spec)}%) · NO-DATA ${nodata} (${pct(nodata)}%)\n\n`;
out += `| Область | Вопрос | Вердикт | Conf | Длина |\n|---|---|---|---|---|\n`;
out += rows.map((r) => `| ${esc(r.area)} | ${esc(r.q).slice(0, 70)} | ${r.verdict} | ${r.conf ?? ''} | ${r.len} |`).join('\n');
out += `\n\n> Цель — снижать долю NO-DATA: каждый NO-DATA = пробел документации → написать спеку и перепрогнать.\n`;

const reportPath = path.resolve('workspaces/documentation/product/specs/CALIBRATION-REPORT.md');
try { fs.writeFileSync(reportPath, out); } catch { /* repo may be absent on server */ }
console.log(`Calibration: ANSWERED ${answered}/${n} (${pct(answered)}%) | SPECULATIVE ${spec} | NO-DATA ${nodata}`);
for (const r of rows) console.log(`  [${r.verdict}] (${r.area}) ${r.q.slice(0, 60)}`);
