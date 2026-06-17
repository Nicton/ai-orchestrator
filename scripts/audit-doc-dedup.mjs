/**
 * #6 — Аудит дублей и расхождений в документации.
 * Проходит по workspaces/documentation/product/**.md и ищет:
 *  - дублирующиеся id граф-метаданных,
 *  - дублирующиеся заголовки,
 *  - одно требование (REQ-*), покрытое >1 документом (риск расхождения),
 *  - один code_ref, документируемый >1 документом,
 *  - near-duplicate документы (Jaccard по токенам >= 0.55).
 * Результат → workspaces/documentation/product/specs/DEDUP-AUDIT.md
 *
 * Usage: node scripts/audit-doc-dedup.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('workspaces/documentation/product');
const STOP = new Set('this that with from have which when what your порядок если или для это как что нет the and для при или это'.split(/\s+/));
const tok = (s) => (String(s || '').toLowerCase().match(/[a-zа-яё0-9]{4,}/gi) || []).filter((t) => !STOP.has(t));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|\.git/.test(e.name)) walk(p, out); }
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const docs = walk(ROOT).map((abs) => {
  const raw = fs.readFileSync(abs, 'utf8');
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
  const title = (body.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
  const metaIdx = raw.indexOf('Граф-метаданные');
  const meta = metaIdx >= 0 ? raw.slice(metaIdx) : '';
  const id = (meta.match(/\*\*id:\*\*\s*`?([^`\n·]+)`?/) || [, ''])[1].trim();
  const reqs = [...new Set((meta.match(/REQ-[A-Z]+-[0-9.]+/g) || []))];
  const codeRefs = [...new Set((meta.match(/\*\*code_refs:\*\*([^\n]*)/) || [, ''])[1].match(/`([^`]+)`/g) || [])].map((s) => s.replace(/`/g, ''));
  return { rel, title, id, reqs, codeRefs, tokens: new Set(tok(body)), isSpec: /source_type:\s*spec/.test(raw) };
});

const jaccard = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
function groupBy(arr, key) {
  const m = {}; for (const d of arr) { const k = key(d); if (!k) continue; (m[k] = m[k] || []).push(d); } return m;
}

// 1) дубли id
const dupIds = Object.entries(groupBy(docs.filter((d) => d.id), (d) => d.id)).filter(([, v]) => v.length > 1);
// 2) дубли заголовков
const dupTitles = Object.entries(groupBy(docs.filter((d) => d.title), (d) => d.title.toLowerCase())).filter(([, v]) => v.length > 1);
// 3) REQ в нескольких доках
const reqMap = {};
for (const d of docs) for (const r of d.reqs) (reqMap[r] = reqMap[r] || []).push(d.rel);
const reqMulti = Object.entries(reqMap).filter(([, v]) => new Set(v).size > 1).sort((a, b) => b[1].length - a[1].length);
// 4) code_ref в нескольких доках
const crMap = {};
for (const d of docs) for (const c of d.codeRefs) (crMap[c] = crMap[c] || []).push(d.rel);
const crMulti = Object.entries(crMap).filter(([, v]) => new Set(v).size > 1).sort((a, b) => b[1].length - a[1].length);
// 5) near-duplicates (Jaccard >= 0.55), пропускаем спеки vs их же модуль-доки и слишком короткие
const big = docs.filter((d) => d.tokens.size >= 40);
const pairs = [];
for (let i = 0; i < big.length; i++) for (let j = i + 1; j < big.length; j++) {
  const s = jaccard(big[i].tokens, big[j].tokens);
  if (s >= 0.55) pairs.push({ a: big[i].rel, b: big[j].rel, sim: +s.toFixed(2) });
}
pairs.sort((a, b) => b.sim - a.sim);

const esc = (s) => String(s).replace(/\|/g, '\\|');
let out = `---\nsource_type: spec\n---\n# Аудит дублей и расхождений документации (#6)\n\n`;
out += `> Авто-проход по \`product/**.md\` (${docs.length} файлов). Цель — один источник правды на правило.\n\n`;
out += `**Сводка:** дубль-id ${dupIds.length} · дубль-заголовков ${dupTitles.length} · REQ в >1 доке ${reqMulti.length} · code_ref в >1 доке ${crMulti.length} · near-duplicate пар ${pairs.length}\n\n`;

out += `## 1. Дублирующиеся id граф-метаданных (${dupIds.length})\n`;
out += dupIds.length ? dupIds.map(([id, v]) => `- \`${esc(id)}\`: ${v.map((d) => d.rel).join(' · ')}`).join('\n') : '_нет_';
out += `\n\n## 2. Дублирующиеся заголовки (${dupTitles.length})\n`;
out += dupTitles.length ? dupTitles.map(([t, v]) => `- «${esc(v[0].title)}»: ${v.map((d) => d.rel).join(' · ')}`).join('\n') : '_нет_';
out += `\n\n## 3. Требование покрыто >1 документом — риск расхождения (top 30 из ${reqMulti.length})\n`;
out += `| REQ | Документы |\n|---|---|\n`;
out += reqMulti.slice(0, 30).map(([r, v]) => `| ${r} | ${[...new Set(v)].map(esc).join(' · ')} |`).join('\n');
out += `\n\n## 4. Один code_ref в >1 документе — возможный дубль описания (top 25 из ${crMulti.length})\n`;
out += `| code_ref | Документы |\n|---|---|\n`;
out += crMulti.slice(0, 25).map(([c, v]) => `| \`${esc(c)}\` | ${[...new Set(v)].map(esc).join(' · ')} |`).join('\n');
out += `\n\n## 5. Near-duplicate документы (Jaccard ≥ 0.55, top 40 из ${pairs.length})\n`;
out += `| Сходство | Документ A | Документ B |\n|---|---|---|\n`;
out += pairs.slice(0, 40).map((p) => `| ${p.sim} | ${esc(p.a)} | ${esc(p.b)} |`).join('\n');
out += `\n\n## Как читать\n- §3/§4: одинаковые REQ/код в разных доках → проверить на расхождение, оставить один авторитетный источник (или явные ссылки).\n- §5: высокое сходство → кандидаты на слияние/удаление дубля (правило памяти: новые файлы, старые не трогаем — здесь только список для ревью).\n`;
out += `\n---\n\n## 🔗 Граф-метаданные\n- **id:** \`specs.audit.dedup\`\n- **type:** spec · **domain:** TMS · **status:** partial\n- **confluence:** — · **repo:** \`specs/DEDUP-AUDIT.md\`\n- **modules:** TMS\n- **requirements:** —\n`;

fs.writeFileSync(path.join(ROOT, 'specs/DEDUP-AUDIT.md'), out);
console.log(`DEDUP-AUDIT.md: ${docs.length} docs | dupIds ${dupIds.length} | dupTitles ${dupTitles.length} | reqMulti ${reqMulti.length} | crMulti ${crMulti.length} | nearDup ${pairs.length}`);
