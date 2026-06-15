#!/usr/bin/env node
/**
 * Graph collector — парсит блоки `## 🔗 Граф-метаданные` во всех .md product/
 * и строит граф (узлы/рёбра) для графовой БД + таблицу покрытия.
 *
 * Узлы:  doc | module | code_file | requirement | confluence
 * Рёбра: doc-[documents]->code_file, doc-[belongs_to]->module,
 *        doc-[references]->doc, requirement-[covered_by]->doc,
 *        doc-[published_as]->confluence
 *
 * Запуск:  node tools/build-graph.cjs   (из папки product/)
 * Выход:   tools/graph.json  +  tools/coverage.md  + сводка в stdout
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..'); // product/
function walk(d, acc = []) {
  for (const f of fs.readdirSync(d)) {
    if (f === 'node_modules' || f === 'tools') continue;
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (f.endsWith('.md')) acc.push(p);
  }
  return acc;
}

// извлечь значение поля из строки "- **key:** value"
function field(block, key) {
  const re = new RegExp('\\*\\*' + key + ':\\*\\*\\s*(.+)');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}
// разбить список (по запятым, очистить markdown code-ticks и пометки)
function list(v) {
  if (!v) return [];
  return v.split(',')
    .map(s => s.replace(/`/g, '').replace(/\*/g, '').trim())
    .filter(s => s && !/^\(|^—$|^нет\b/i.test(s));
}

const files = walk(ROOT);
const nodes = { doc: {}, module: {}, code_file: {}, requirement: {}, confluence: {}, feature: {}, screen: {} };
const edges = [];
const docsWithMeta = [];
const docsWithoutMeta = [];
const docStore = {}; // id -> { md, domain, rel } для извлечения фич/экранов

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const md = fs.readFileSync(file, 'utf8');
  const idx = md.indexOf('Граф-метаданные');
  if (idx < 0) { docsWithoutMeta.push(rel); continue; }
  const block = md.slice(idx);

  const id = field(block, 'id') ? field(block, 'id').replace(/`/g, '').trim() : rel;
  const typeLine = field(block, 'type') || '';
  const type = (typeLine.split('·')[0] || '').replace(/[^a-z-]/gi, '').trim() || 'module-doc';
  const domain = (typeLine.match(/domain:\*?\*?\s*([A-Za-z&-]+)/) || [])[1] || field(block, 'domain') || '?';
  const status = (typeLine.match(/status:\*?\*?\s*([a-z-]+)/) || [])[1] || 'implemented';
  const confluence = (field(block, 'confluence') || '').replace(/`/g, '').replace(/·.*/, '').trim();
  const repo = field(block, 'repo');
  const codeRefs = list(field(block, 'code_refs'));
  const modules = list(field(block, 'modules'));
  const references = list(field(block, 'references'));
  const reqRaw = field(block, 'requirements') || '';
  const requirements = (reqRaw.match(/REQ-[A-Z]+-[0-9.]+/g) || []);

  nodes.doc[id] = { id, type, domain, status, confluence: confluence || null, repo, code_refs: codeRefs.length };
  docsWithMeta.push({ id, rel, domain, requirements: requirements.length });
  docStore[id] = { md, domain, rel };

  if (domain && domain !== '?') { nodes.module[domain] = { id: domain }; edges.push(['doc:' + id, 'belongs_to', 'module:' + domain]); }
  for (const m of modules) { nodes.module[m] = { id: m }; edges.push(['doc:' + id, 'relates_to', 'module:' + m]); }
  for (const c of codeRefs) { nodes.code_file[c] = { id: c }; edges.push(['doc:' + id, 'documents', 'code:' + c]); }
  for (const r of references) { edges.push(['doc:' + id, 'references', 'doc:' + r]); }
  for (const q of requirements) { nodes.requirement[q] = { id: q }; edges.push(['req:' + q, 'covered_by', 'doc:' + id]); }
  if (confluence && /^\d+$/.test(confluence)) { nodes.confluence[confluence] = { id: confluence }; edges.push(['doc:' + id, 'published_as', 'confluence:' + confluence]); }
}

// ───────────────────────────────────────────────────────────────────────────
// Гранулярность: фичи / экраны / модалки (гибрид-извлечение из наших артефактов)
//   - screen/modal: реестр SCREENSHOTS-TODO.md + UI-роуты в блоках «Где найти»
//   - feature: сущности из GLOSSARY.md (раздел индекса) + LLM-аннотации (если есть)
//   - кросс-модульность: один и тот же экран/роут/фича, встречаясь в доках разных
//     доменов, порождает рёбра к каждому — связь видна между модулями.
// ───────────────────────────────────────────────────────────────────────────
const MODAL_RE = /модал|modal|вкладк|\btab\b|drawer|popup|pop-up|wizard|мастер|диалог|dialog|мод\.|окно/i;

// карта rel-каталога → docId (для связывания экранов реестра с доками)
const relDirToDoc = {};
for (const d of docsWithMeta) {
  relDirToDoc[d.rel] = d.id;
  relDirToDoc[d.rel.replace(/\/README\.md$/, '').replace(/\.md$/, '')] = d.id;
}
function findDocByHint(hint) {
  if (!hint) return null;
  hint = hint.replace(/`/g, '').trim();
  if (!hint) return null;
  if (relDirToDoc[hint]) return relDirToDoc[hint];
  const k = Object.keys(relDirToDoc).find(k => k === hint || k.startsWith(hint + '/') || k.startsWith(hint));
  return k ? relDirToDoc[k] : null;
}
function slug(s) { return s.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80); }

// регистрация экрана/модалки + ребро от дока
function addScreen(label, route, docId) {
  label = (label || '').replace(/\*\*/g, '').replace(/`/g, '').trim();
  route = (route || '').replace(/`/g, '').trim();
  if (!label && !route) return;
  const kind = MODAL_RE.test(label) ? 'modal' : 'screen';
  const id = route && route !== '—' ? route : slug(label);
  if (!id) return;
  if (!nodes.screen[id]) nodes.screen[id] = { id, label: label || route, route: route || null, kind };
  else if (MODAL_RE.test(label) && nodes.screen[id].kind !== 'modal') nodes.screen[id].kind = 'modal';
  if (docId) edges.push(['doc:' + docId, kind === 'modal' ? 'has_modal' : 'has_screen', 'screen:' + id]);
}
function addFeature(name, docId) {
  name = (name || '').replace(/\*\*/g, '').replace(/`/g, '').trim();
  if (!name || name.length < 2) return;
  const id = slug(name);
  if (!id) return;
  if (!nodes.feature[id]) nodes.feature[id] = { id, name };
  if (docId) edges.push(['doc:' + docId, 'has_feature', 'feature:' + id]);
}

// 1) Реестр экранов SCREENSHOTS-TODO.md: | # | Экран | Док | UI-роут | … |
try {
  const reg = fs.readFileSync(path.join(ROOT, 'SCREENSHOTS-TODO.md'), 'utf8');
  const rowRe = /^\|\s*[A-Za-z]*\d+\s*\|([^|]+)\|([^|]+)\|([^|]+)\|/gm;
  let m;
  while ((m = rowRe.exec(reg))) addScreen(m[1], m[3], findDocByHint(m[2]));
} catch { /* нет реестра — пропуск */ }

// 2) UI-роуты внутри доков (блоки «Где найти»/«UI»): строки с `/route`
for (const [id, { md }] of Object.entries(docStore)) {
  // ограничиваемся секциями про UI, чтобы не цеплять код-пути
  const uiSec = (md.match(/##[^\n]*(Где найти|UI-?путь|UI\)|Где настроить)[\s\S]*?(?=\n## |\n## 🔗|$)/gi) || []).join('\n');
  const routeRe = /`(\/[a-z0-9/_:{}-]{2,})`/gi;
  let r; const seen = new Set();
  while ((r = routeRe.exec(uiSec))) { if (!seen.has(r[1])) { seen.add(r[1]); addScreen(r[1], r[1], id); } }
}

// 3) Фичи из индекса сущностей GLOSSARY.md: | **Name** | … | [text](path) |
try {
  const gl = fs.readFileSync(path.join(ROOT, 'GLOSSARY.md'), 'utf8');
  const rowRe = /^\|\s*\*\*([^*|]+)\*\*[^|]*\|[^|]*\|\s*\[[^\]]+\]\(([^)#]+)[^)]*\)\s*\|/gm;
  let m;
  while ((m = rowRe.exec(gl))) {
    const name = m[1].trim();
    const target = m[2].replace(/`/g, '').trim();
    const docId = relDirToDoc[target] || relDirToDoc[target.replace(/\/README\.md$/, '').replace(/\.md$/, '')] || findDocByHint(target);
    addFeature(name, docId);
  }
} catch { /* нет глоссария */ }

// 4) LLM-аннотации (опционально): tools/feature-annotations.json
//    формат: { "<docId>": { features:[..], modals:[{label,route}..] } }
try {
  const ann = JSON.parse(fs.readFileSync(path.join(__dirname, 'feature-annotations.json'), 'utf8'));
  for (const [docId, a] of Object.entries(ann)) {
    if (!nodes.doc[docId]) continue;
    (a.features || []).forEach(f => addFeature(typeof f === 'string' ? f : f.name, docId));
    (a.modals || []).forEach(s => addScreen(s.label || s, s.route || '', docId));
    (a.screens || []).forEach(s => addScreen(s.label || s, s.route || '', docId));
  }
} catch { /* LLM-аннотаций ещё нет */ }

// 5) Кросс-модульность: фича/модалка, упомянутая в доке ИНОГО дока → ребро mentions.
//    Так одна фича связывает доки разных доменов — видно, что она встречается в разных модулях.
const haveFeatEdge = new Set(edges.filter(e => e[1] === 'has_feature').map(e => e[0] + '|' + e[2]));
const featTerms = Object.values(nodes.feature)
  .map(f => ({ id: f.id, term: f.name.replace(/\s*\(.*?\)\s*/g, '').trim() }))
  .filter(f => f.term.length >= 4);
for (const [docId, { md }] of Object.entries(docStore)) {
  const body = md.toLowerCase();
  for (const { id, term } of featTerms) {
    const pair = 'doc:' + docId + '|feature:' + id;
    if (haveFeatEdge.has(pair)) continue;            // родной док уже связан has_feature
    if (body.includes(term.toLowerCase())) edges.push(['doc:' + docId, 'mentions', 'feature:' + id]);
  }
}

// 6) Доп. детект модалок по тексту — КОНСЕРВАТИВНО: только с явным именем
//    (в кавычках «…»/"…" или **жирным**) рядом с ключевым словом модалки/визарда.
//    Богатое извлечение модалок выполняет LLM-аннотатор (см. tools/feature-annotations.json).
for (const [docId, { md }] of Object.entries(docStore)) {
  const re = /(?:модальн\w*\s+окн\w*|модал\w*|wizard|мастер|drawer|диалог)[^\n]{0,40}?(?:[«"]([^»"\n]{3,50})[»"]|\*\*([^*\n]{3,50})\*\*)/gi;
  let m, n = 0;
  while ((m = re.exec(md)) && n < 6) {
    const name = (m[1] || m[2] || '').trim();
    if (name.length >= 3) { addScreen(name + ' (модал)', '', docId); n++; }
  }
}

// дедуп рёбер (могли продублироваться при множественных проходах)
{
  const seen = new Set();
  const uniq = [];
  for (const e of edges) { const k = e.join('|'); if (!seen.has(k)) { seen.add(k); uniq.push(e); } }
  edges.length = 0; edges.push(...uniq);
}

const modalCount = Object.values(nodes.screen).filter(s => s.kind === 'modal').length;

const graph = {
  generated: 'run date stamped externally',
  stats: {
    docs_total: files.length,
    docs_with_metadata: docsWithMeta.length,
    docs_without_metadata: docsWithoutMeta.length,
    modules: Object.keys(nodes.module).length,
    code_files: Object.keys(nodes.code_file).length,
    requirements: Object.keys(nodes.requirement).length,
    features: Object.keys(nodes.feature).length,
    screens: Object.keys(nodes.screen).length - modalCount,
    modals: modalCount,
    edges: edges.length,
  },
  nodes,
  edges,
  docs_without_metadata: docsWithoutMeta,
};

fs.writeFileSync(path.join(__dirname, 'graph.json'), JSON.stringify(graph, null, 2));

// coverage.md — модуль × {docs, requirements, code}
const byModule = {};
for (const d of docsWithMeta) {
  byModule[d.domain] = byModule[d.domain] || { docs: 0, reqs: 0 };
  byModule[d.domain].docs++;
  byModule[d.domain].reqs += d.requirements;
}
let cov = '# Покрытие (авто-сгенерировано build-graph.cjs)\n\n';
cov += `> Документов: ${graph.stats.docs_total} · с метаданными: ${graph.stats.docs_with_metadata} · без: ${graph.stats.docs_without_metadata} · модулей: ${graph.stats.modules} · код-файлов: ${graph.stats.code_files} · требований: ${graph.stats.requirements} · рёбер: ${graph.stats.edges}\n\n`;
cov += '| Домен | Документов | Требований (в метаданных) |\n|-------|-----------|---------------------------|\n';
for (const [m, v] of Object.entries(byModule).sort((a, b) => b[1].docs - a[1].docs)) cov += `| ${m} | ${v.docs} | ${v.reqs} |\n`;
cov += '\n## Документы без граф-метаданных (' + docsWithoutMeta.length + ') — TODO волна 7.1\n\n';
docsWithoutMeta.forEach(f => cov += '- ' + f + '\n');
fs.writeFileSync(path.join(__dirname, 'coverage.md'), cov);

console.log(JSON.stringify(graph.stats, null, 2));
