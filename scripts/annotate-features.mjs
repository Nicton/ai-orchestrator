/**
 * LLM annotator: extracts features / modals / screens (with cross-module hints)
 * from each documentation doc and caches them into
 *   workspaces/documentation/product/tools/feature-annotations.json
 * which build-graph.cjs merges into the knowledge graph.
 *
 * Incremental & resumable: each doc is keyed by its graph-metadata id + a content
 * hash; unchanged docs are skipped on re-run. Uses the `claude` CLI (same path as
 * src/llm.ts). Safe to run in the background.
 *
 * Usage:
 *   node scripts/annotate-features.mjs            # annotate all changed docs
 *   node scripts/annotate-features.mjs --limit 5  # only first N changed docs (sampling)
 *   node scripts/annotate-features.mjs --only tms/shipments   # path substring filter
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

const PRODUCT = path.resolve(process.cwd(), 'workspaces/documentation/product');
const OUT = path.join(PRODUCT, 'tools', 'feature-annotations.json');
const MODEL = process.env.ANNOTATE_MODEL || 'claude-sonnet-4-6';

const args = process.argv.slice(2);
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const CONCURRENCY = 3;

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
function docId(md, rel) {
  const i = md.indexOf('Граф-метаданные');
  if (i < 0) return null;
  const m = md.slice(i).match(/\*\*id:\*\*\s*`?([^`\n·]+)`?/);
  return m ? m[1].trim() : rel.replace(/\.md$/, '').replace(/\//g, '.');
}

function claude(prompt) {
  return new Promise((resolve) => {
    const proc = spawn('claude', ['-p', prompt, '--output-format', 'json', '--model', MODEL], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    proc.stdout.on('data', (c) => (out += c.toString()));
    proc.on('close', () => {
      try { const j = JSON.parse(out); resolve(j.result ?? out); } catch { resolve(out); }
    });
    proc.on('error', () => resolve(''));
  });
}

function extractJson(text) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

const PROMPT = (id, body) => `Ты анализируешь документ продуктовой документации Shiptify (id: ${id}).
Извлеки из текста СУЩНОСТИ интерфейса/функциональности и верни СТРОГО JSON без пояснений:
{
  "features": ["краткое имя фичи", ...],        // функциональные возможности (макс 12)
  "modals":   [{"label":"имя модального окна/визарда/диалога","route":"/маршрут-если-есть"}],  // модальные окна, wizard'ы, drawer'ы (макс 12)
  "screens":  [{"label":"имя экрана/страницы","route":"/маршрут"}]                              // экраны/страницы (макс 12)
}
Правила: только то, что реально упомянуто в тексте; имена краткие (2-5 слов), по-русски как в доке; route только если явно указан (в \`обратных кавычках\`); если чего-то нет — пустой массив. НЕ выдумывай.

ДОКУМЕНТ:
${body.slice(0, 9000)}`;

async function main() {
  const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const meta = cache.__meta || {}; // id -> hash
  const files = walk(PRODUCT).filter((f) => !only || f.includes(only.split('/').join(path.sep)) || f.replace(/\\/g, '/').includes(only));

  const tasks = [];
  for (const fp of files) {
    const rel = path.relative(PRODUCT, fp).split(path.sep).join('/');
    const md = fs.readFileSync(fp, 'utf8');
    const id = docId(md, rel);
    if (!id) continue;
    const hash = createHash('sha1').update(md).digest('hex').slice(0, 12);
    if (meta[id] === hash && cache[id]) continue; // unchanged, already annotated
    tasks.push({ id, md, hash });
  }
  const todo = tasks.slice(0, limit);
  console.log(`Docs to annotate: ${todo.length} (of ${tasks.length} changed; ${files.length} scanned)`);

  let done = 0;
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (t) => {
      const text = await claude(PROMPT(t.id, t.md));
      const j = extractJson(text);
      if (j) {
        cache[t.id] = { features: j.features || [], modals: j.modals || [], screens: j.screens || [] };
        (cache.__meta = cache.__meta || {})[t.id] = t.hash;
      }
      done++;
    }));
    fs.writeFileSync(OUT, JSON.stringify(cache, null, 2)); // checkpoint
    console.log(`  …${done}/${todo.length}`);
  }
  const feats = Object.values(cache).reduce((a, v) => a + (v.features?.length || 0), 0);
  const modals = Object.values(cache).reduce((a, v) => a + (v.modals?.length || 0), 0);
  console.log(`Done. Cached ${Object.keys(cache).length - 1} docs · ${feats} features · ${modals} modals → ${path.relative(process.cwd(), OUT)}`);
  console.log('Now run: node workspaces/documentation/product/tools/build-graph.cjs (merges annotations)');
}
main();
