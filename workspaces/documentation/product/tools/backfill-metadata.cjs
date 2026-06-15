#!/usr/bin/env node
/**
 * Backfill минимальных граф-метаданных в .md без них (волна 7.1).
 * Делает каждый документ узлом графа: id (из пути), domain (из папки), repo, type.
 * code_refs/references/requirements оставляет TODO — заполняются вручную при углублении.
 * Идемпотентно: пропускает файлы, где блок уже есть.
 * Запуск: node tools/backfill-metadata.cjs   (из product/)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const DOMAIN = {
  tms: 'TMS', dock: 'DOCK', integrations: 'Integrations', 'back-office': 'Back-Office',
  'admin-app': 'Admin-App', 'mini-apps': 'Mini-Apps', ai: 'AI', identity: 'Identity',
  chat: 'Chat', carrier: 'Carrier', 'business-vision': 'TMS', onboarding: 'Back-Office',
  microservices: 'Microservices',
};
// служебные/корневые файлы — без авто-метаданных (это не модульные доки)
const SKIP = /^(SYSTEM-MAP|AUDIT-PLAN|GRAPH-METADATA-SPEC|SCREENSHOTS-TODO|DASHBOARD|WORK-REPORT-|DEFECTS-CANDIDATES|COVERAGE-PLAN|RTM-MASTER|README)\.md$|TEMPLATE\.md$/;

function walk(d, acc = []) {
  for (const f of fs.readdirSync(d)) {
    if (f === 'node_modules' || f === 'tools') continue;
    const p = path.join(d, f); const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc); else if (f.endsWith('.md')) acc.push(p);
  }
  return acc;
}
function idFromRel(rel) {
  return rel.replace(/\.md$/, '').replace(/\/README$/i, '').split('/')
    .map(s => s.replace(/[^A-Za-z0-9_-]/g, '-')).join('.').toLowerCase();
}

let added = 0, skipped = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const base = path.basename(file);
  const md = fs.readFileSync(file, 'utf8');
  if (md.includes('Граф-метаданные')) { skipped++; continue; }
  if (SKIP.test(base) && !rel.includes('/')) { skipped++; continue; } // корневые служебные — пропуск
  const top = rel.split('/')[0];
  const domain = DOMAIN[top] || 'TMS';
  const id = idFromRel(rel);
  const isReadmeRoot = /README\.md$/i.test(base) && rel.split('/').length <= 2;
  const type = isReadmeRoot ? 'overview' : 'module-doc';
  const block = `\n\n---\n\n## 🔗 Граф-метаданные\n- **id:** \`${id}\`\n- **type:** ${type} · **domain:** ${domain} · **status:** implemented\n- **confluence:** — · **repo:** \`${rel}\`\n- **code_refs:** TODO (заполнить при углублении)\n- **modules:** ${domain}\n- **references:** —\n- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)\n`;
  fs.writeFileSync(file, md.replace(/\s*$/, '') + block + '\n');
  added++;
}
console.log('Backfilled:', added, '| Skipped (had meta or service):', skipped);
