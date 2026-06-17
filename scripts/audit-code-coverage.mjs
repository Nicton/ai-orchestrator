/**
 * #4 — Обратный проход «код → доки»: что в коде НЕ покрыто документацией.
 * Извлекает из backend/app:
 *  - пользовательские тексты ошибок (new *Error('...')) — саппорт цитирует именно их,
 *  - HTTP-эндпоинты (router/app .get/.post/...),
 * сверяет с корпусом product/**.md и выдаёт НЕпокрытое (кандидаты в спеки).
 * Результат → workspaces/documentation/product/specs/CODE-COVERAGE-AUDIT.md
 *
 * Usage: node scripts/audit-code-coverage.mjs
 */
import fs from 'fs';
import path from 'path';

const CODE = path.resolve('workspaces/backend/app');
const DOCS = path.resolve('workspaces/documentation/product');
const tok = (s) => (String(s || '').toLowerCase().match(/[a-zа-яё0-9]{5,}/gi) || []);

function walk(dir, exts, out = [], cap = 8000) {
  if (out.length >= cap) return out;
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (out.length >= cap) break;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|\.git|__mocks__|test/.test(e.name)) walk(p, exts, out, cap); }
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

// 1) корпус доков (нижний регистр)
let corpus = '';
for (const f of walk(DOCS, ['.md'])) { try { corpus += '\n' + fs.readFileSync(f, 'utf8').toLowerCase(); } catch {} }
const inDocs = (s) => corpus.includes(String(s).toLowerCase());
const tokensCovered = (msg) => { const ts = [...new Set(tok(msg))]; if (!ts.length) return false; return ts.every((t) => corpus.includes(t)); };

// 2) извлечение из кода
const codeFiles = walk(CODE, ['.js', '.ts']);
const errors = new Map();   // message -> {count, files:Set}
const endpoints = new Map(); // path -> {methods:Set, count}
const ERR_RE = /new\s+\w*Error\(\s*[`'"]([^`'"]{6,180})[`'"]/g;
const EP_RE = /\.(get|post|put|patch|delete)\(\s*[`'"]([^`'"]{2,90})[`'"]/g;
for (const f of codeFiles) {
  let raw; try { raw = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (raw.length > 400_000) continue;
  const rel = path.relative(path.resolve('workspaces'), f).split(path.sep).join('/');
  let m;
  while ((m = ERR_RE.exec(raw))) {
    const msg = m[1].trim();
    if (/\$\{|^\s*$|select |insert |update /i.test(msg)) continue; // пропуск шаблонов/SQL
    const e = errors.get(msg) || { count: 0, files: new Set() };
    e.count++; e.files.add(rel); errors.set(msg, e);
  }
  while ((m = EP_RE.exec(raw))) {
    const p = m[2].trim();
    if (!/^[/:a-z]/i.test(p) || p.length < 3) continue;
    const e = endpoints.get(p) || { methods: new Set(), count: 0 };
    e.methods.add(m[1].toUpperCase()); e.count++; endpoints.set(p, e);
  }
}

const errArr = [...errors.entries()].map(([msg, v]) => ({ msg, count: v.count, files: [...v.files], covered: inDocs(msg) || tokensCovered(msg) }));
const epArr = [...endpoints.entries()].map(([p, v]) => ({ p, methods: [...v.methods], count: v.count, covered: inDocs(p) || inDocs(p.split('/').filter(Boolean).slice(-1)[0] || p) }));
const errUncovered = errArr.filter((e) => !e.covered).sort((a, b) => b.count - a.count);
const epUncovered = epArr.filter((e) => !e.covered).sort((a, b) => b.count - a.count);
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

const esc = (s) => String(s).replace(/\|/g, '\\|');
let out = `---\nsource_type: spec\n---\n# Аудит покрытия «код → документация» (#4)\n\n`;
out += `> Обратный проход: что в коде backend есть, но НЕ объяснено в \`product/**.md\`. Каждая необъяснённая\n`;
out += `> ошибка/эндпоинт — потенциальный вопрос поддержки и кандидат в спеку.\n\n`;
out += `**Сводка:** код-файлов ${codeFiles.length} · уник. ошибок ${errArr.length} (покрыто ${pct(errArr.length - errUncovered.length, errArr.length)}%) · эндпоинтов ${epArr.length} (покрыто ${pct(epArr.length - epUncovered.length, epArr.length)}%)\n\n`;

out += `## 1. Тексты ошибок БЕЗ объяснения в доках (top 50 из ${errUncovered.length})\n`;
out += `> Саппорт цитирует именно эти строки. Приоритет — по частоте в коде.\n\n`;
out += `| Частота | Сообщение об ошибке | Где в коде (1й файл) |\n|---|---|---|\n`;
out += errUncovered.slice(0, 50).map((e) => `| ${e.count} | ${esc(e.msg).slice(0, 90)} | \`${esc(e.files[0] || '')}\` |`).join('\n');
out += `\n\n## 2. Эндпоинты БЕЗ упоминания в доках (top 40 из ${epUncovered.length})\n`;
out += `| Частота | Методы | Путь |\n|---|---|---|\n`;
out += epUncovered.slice(0, 40).map((e) => `| ${e.count} | ${e.methods.join(',')} | \`${esc(e.p)}\` |`).join('\n');
out += `\n\n## Как использовать\n- §1: топ необъяснённых ошибок → писать спеки «почему возникает ошибка X и что делать» (как уже сделали для «Recognized Shipper is not available»).\n- §2: эндпоинты без доков → кандидаты на спеки поведения API.\n- Покрытие токенами консервативно (англ. ошибки vs рус. доки) — список скорее переоценивает пробелы, что для бэклога безопаснее.\n`;
out += `\n---\n\n## 🔗 Граф-метаданные\n- **id:** \`specs.audit.code-coverage\`\n- **type:** spec · **domain:** TMS · **status:** partial\n- **confluence:** — · **repo:** \`specs/CODE-COVERAGE-AUDIT.md\`\n- **modules:** TMS\n- **requirements:** —\n`;

fs.writeFileSync(path.join(DOCS, 'specs/CODE-COVERAGE-AUDIT.md'), out);
console.log(`CODE-COVERAGE-AUDIT.md: code ${codeFiles.length} files | errors ${errArr.length} (uncovered ${errUncovered.length}) | endpoints ${epArr.length} (uncovered ${epUncovered.length})`);
