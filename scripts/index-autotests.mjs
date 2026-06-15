/**
 * Index the repo's TestCafe autotests (workspaces/main-app-automation/src/tests)
 * into docs/qa/autotests-index.json so the Quality Coverage Engine can use them as
 * the Automation layer (matched to requirements by text). The automation repo is not
 * in the deploy build context, so we commit a compact index instead.
 *
 * Usage: node scripts/index-autotests.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'workspaces/main-app-automation/src/tests');
const OUT = path.resolve(process.cwd(), 'docs/qa/autotests-index.json');

const RULES = [
  [/slot|dock|gate|visit|zone|planning|tv-?display|loadview/i, 'DOCK'],
  [/heppner|dhl|fedex|\bups\b|inttra|edifact|\bsap\b|\bp44\b|shippeo|aftership|teliae|teliway|calvacom|dachser|kuehne|schenker|webhook|emailing|brinks|integration|publicapi|public-api/i, 'Integrations'],
  [/role|team|spectator|booker|invite|permission|admin/i, 'Admin-App'],
  [/\bchat\b|message|discussion|notification/i, 'Chat'],
  [/miniapp|mini-app|driver|carrierportal|quickshipment/i, 'Mini-Apps'],
];
function domainOf(p) { for (const [re, d] of RULES) if (re.test(p)) return d; return 'TMS'; }

const STOP = new Set('test tests spec fixture api ui get post put patch delete the and for src app should index page'.split(' '));
function toks(s) {
  // разбить camelCase + по разделителям
  const norm = String(s).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[\/_.-]/g, ' ');
  return [...new Set((norm.toLowerCase().match(/[a-zа-я0-9]{4,}/gi) || []).filter((w) => !STOP.has(w)))];
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules') continue;
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (f.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);
const items = [];
const byDomain = {};
let totalTests = 0;
for (const fp of files) {
  let txt = '';
  try { txt = fs.readFileSync(fp, 'utf8'); } catch { continue; }
  const isTest = /\bfixture\s*[(`]/.test(txt) || /\btest\s*[(`]/.test(txt);
  if (!isTest) continue;
  const rel = path.relative(ROOT, fp).split(path.sep).join('/');
  const testNames = [...txt.matchAll(/\btest\s*[(`]\s*[`'"]([^`'"]{3,120})/g)].map((m) => m[1]);
  const fixtureNames = [...txt.matchAll(/\bfixture\s*[(`]\s*[`'"]([^`'"]{3,120})/g)].map((m) => m[1]);
  const n = testNames.length || 1;
  totalTests += n;
  const domain = domainOf(rel);
  byDomain[domain] = (byDomain[domain] || 0) + n;
  const tk = [...new Set([...toks(rel), ...fixtureNames.flatMap(toks), ...testNames.flatMap(toks)])];
  items.push({ domain, n, tk });
}

const index = { generated: 'stamped externally', totalFiles: items.length, totalTests, byDomain, items };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(index));
console.log(`autotests indexed: ${items.length} files, ${totalTests} tests`);
console.log('byDomain:', JSON.stringify(byDomain));
