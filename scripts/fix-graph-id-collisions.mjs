/**
 * Устраняет коллизии graph-id (#6): когда у двух доков одинаковый `- **id:** \`X\``.
 * Канон — README.md (или самый короткий путь); остальным файлам присваивается суб-id
 * `X.<slug>` (slug из имени файла, без дублирования последнего сегмента id).
 * Идемпотентно. Usage: node scripts/fix-graph-id-collisions.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('workspaces/documentation/product');
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|\.git/.test(e.name)) walk(p, out); }
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}
const ID_RE = /(-\s*\*\*id:\*\*\s*`)([^`]+)(`)/;

const files = walk(ROOT).map((abs) => {
  const raw = fs.readFileSync(abs, 'utf8');
  const m = raw.match(ID_RE);
  return { abs, rel: path.relative(ROOT, abs).split(path.sep).join('/'), id: m ? m[2].trim() : null, raw };
}).filter((f) => f.id);

const groups = {};
for (const f of files) (groups[f.id] = groups[f.id] || []).push(f);

const slug = (s) => s.toLowerCase().replace(/\.md$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
let changed = 0;
for (const [id, group] of Object.entries(groups)) {
  if (group.length < 2) continue;
  // канон: README.md, иначе самый короткий rel
  const canon = group.find((g) => /(^|\/)README\.md$/i.test(g.rel)) || [...group].sort((a, b) => a.rel.length - b.rel.length)[0];
  const lastSeg = id.split('.').pop();
  for (const f of group) {
    if (f === canon) continue;
    let suffix = slug(path.basename(f.rel));
    if (suffix.startsWith(lastSeg + '-')) suffix = suffix.slice(lastSeg.length + 1);
    else if (suffix === lastSeg) suffix = 'alt';
    let newId = `${id}.${suffix}`;
    // гарантируем уникальность
    let n = 2; while (files.some((x) => x.id === newId && x.abs !== f.abs)) newId = `${id}.${suffix}-${n++}`;
    const updated = f.raw.replace(ID_RE, `$1${newId}$3`);
    if (updated !== f.raw) { fs.writeFileSync(f.abs, updated); f.id = newId; changed++; console.log(`  ${f.rel}: ${id} → ${newId}`); }
  }
}
console.log(`Fixed ${changed} colliding id(s).`);
