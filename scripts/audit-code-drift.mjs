/**
 * #5 — Детектор устаревания спек (code-drift).
 * Извлекает из specs/**.md ссылки на код вида `file.js:line` (и code_refs),
 * сверяет с реальными файлами в workspaces/ (по basename): существует ли файл и
 * есть ли указанная строка. Несостыковки = спека ссылается на изменившийся/удалённый код.
 * Результат → workspaces/documentation/product/specs/CODE-DRIFT-AUDIT.md
 *
 * Usage: node scripts/audit-code-drift.mjs
 */
import fs from 'fs';
import path from 'path';

const SPECS = path.resolve('workspaces/documentation/product/specs');
const WS = path.resolve('workspaces');
const CODE_EXT = new Set(['.js', '.ts', '.cjs', '.mjs', '.jsx', '.tsx']);

function walk(dir, test, out = [], cap = 60000) {
  if (out.length >= cap) return out;
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (out.length >= cap) break;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|\.git|dist|build|coverage|\.next/.test(e.name)) walk(p, test, out, cap); }
    else if (test(e.name)) out.push(p);
  }
  return out;
}

// индекс кода: basename -> [{rel, lines}]
const codeIndex = new Map();
for (const f of walk(WS, (n) => CODE_EXT.has(path.extname(n).toLowerCase()))) {
  const base = path.basename(f);
  let lines = 0;
  try { lines = fs.readFileSync(f, 'utf8').split('\n').length; } catch { continue; }
  const rel = path.relative(WS, f).split(path.sep).join('/');
  const arr = codeIndex.get(base) || []; arr.push({ rel, lines }); codeIndex.set(base, arr);
}

// ссылки на код из спек: `name.ext:line` или `name.ext:line-line`
const REF_RE = /([A-Za-z0-9_.\-/]+\.(?:js|ts|cjs|mjs|jsx|tsx)):(\d+)(?:-(\d+))?/g;
const specFiles = walk(SPECS, (n) => n.endsWith('.md'));
const results = []; // {spec, ref, line, status, detail}
for (const sf of specFiles) {
  const rel = path.relative(SPECS, sf).split(path.sep).join('/');
  const raw = fs.readFileSync(sf, 'utf8');
  const seen = new Set();
  let m;
  while ((m = REF_RE.exec(raw))) {
    const ref = m[1]; const line = +m[2];
    const key = `${ref}:${line}`;
    if (seen.has(key)) continue; seen.add(key);
    const base = path.basename(ref);
    const candidates = codeIndex.get(base) || [];
    if (!candidates.length) { results.push({ spec: rel, ref, line, status: 'MISSING', detail: 'файл не найден в workspaces' }); continue; }
    // если ref содержит путь — сузить до совпадающих по хвосту пути; иначе все одноимённые
    const pathMatched = candidates.filter((c) => c.rel.endsWith(ref));
    const set = pathMatched.length ? pathMatched : candidates;
    // ссылка валидна, если ХОТЬ ОДИН подходящий файл содержит указанную строку
    const ok = set.some((c) => c.lines >= line);
    if (!ok) {
      const max = Math.max(...set.map((c) => c.lines));
      results.push({ spec: rel, ref, line, status: 'OUT_OF_RANGE', detail: `строка ${line} > макс. ${max} (${set.length} файл(ов) с именем ${base})` });
    }
  }
}

const missing = results.filter((r) => r.status === 'MISSING');
const oor = results.filter((r) => r.status === 'OUT_OF_RANGE');
const esc = (s) => String(s).replace(/\|/g, '\\|');
let out = `---\nsource_type: spec\n---\n# Аудит устаревания спек — code-drift (#5)\n\n`;
out += `> Сверка код-ссылок (\`файл:строка\`) в спеках с реальным кодом workspaces/. Несостыковка = код\n`;
out += `> переехал/удалён → спеку нужно сверить и обновить.\n\n`;
out += `**Сводка:** спек-файлов ${specFiles.length} · код-файлов в индексе ${[...codeIndex.values()].reduce((a, v) => a + v.length, 0)} · проблемных ссылок ${missing.length + oor.length} (нет файла ${missing.length}, строка вне диапазона ${oor.length})\n\n`;
out += `## Ссылки на отсутствующий код (${missing.length})\n`;
out += missing.length ? `| Спека | Ссылка |\n|---|---|\n` + missing.map((r) => `| ${esc(r.spec)} | \`${esc(r.ref)}:${r.line}\` |`).join('\n') : '_нет_';
out += `\n\n## Ссылки на несуществующую строку (${oor.length})\n`;
out += oor.length ? `| Спека | Ссылка | Деталь |\n|---|---|---|\n` + oor.map((r) => `| ${esc(r.spec)} | \`${esc(r.ref)}:${r.line}\` | ${esc(r.detail)} |`).join('\n') : '_нет_';
out += `\n\n> Прогонять после изменений кода: \`node scripts/audit-code-drift.mjs\`. Пустые секции = спеки в актуальном состоянии.\n`;
out += `\n---\n\n## 🔗 Граф-метаданные\n- **id:** \`specs.audit.code-drift\`\n- **type:** spec · **domain:** TMS · **status:** partial\n- **confluence:** — · **repo:** \`specs/CODE-DRIFT-AUDIT.md\`\n- **modules:** TMS\n- **requirements:** —\n`;

fs.writeFileSync(path.join(SPECS, 'CODE-DRIFT-AUDIT.md'), out);
console.log(`CODE-DRIFT-AUDIT.md: specs ${specFiles.length} | refs checked | MISSING ${missing.length} | OUT_OF_RANGE ${oor.length}`);
