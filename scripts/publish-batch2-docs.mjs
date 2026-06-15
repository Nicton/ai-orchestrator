/**
 * One-time publisher: 8 new TMS feature docs (batch 2) → Confluence
 * Usage: node scripts/publish-batch2-docs.mjs
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EMAIL    = process.env.ATLASSIAN_EMAIL || ';
const TOKEN    = process.env.ATLASSIAN_TOKEN || ';

if (!EMAIL || !TOKEN) {
  throw new Error('Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script.');
}
const HOST     = 'shiptify.atlassian.net';
const SPACE    = 'TD';
const TMS_ROOT = '609583105';
const SHIPS_ID = '609746945';

const AUTH = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');
const DOCS_ROOT = path.resolve(__dirname, '../workspaces/documentation/product/tms');

const BATCH = [
  { file: 'features/doc-workflow.md',           title: 'Documents Workflow — Уведомления о документах',         parentId: SHIPS_ID },
  { file: 'features/freight-units.md',          title: 'Freight Units — Грузовые единицы (FU)',                  parentId: SHIPS_ID },
  { file: 'features/visits-driver-data.md',     title: 'Visits — Expected vs Checked данные водителя',           parentId: SHIPS_ID },
  { file: 'features/labels-sscc.md',            title: 'Labels & SSCC — Штрихкоды и мульти-лейблы',             parentId: SHIPS_ID },
  { file: 'features/logistic-specificities.md', title: 'Logistic Specificities — Специфики груза и ТС',          parentId: SHIPS_ID },
  { file: 'admin/navigation-account-types.md',  title: 'Навигация и типы аккаунтов',                            parentId: TMS_ROOT },
  { file: 'rate-sheets/structure.md',           title: 'Rate Sheet — Структура и алгоритм сборки',              parentId: TMS_ROOT },
  { file: 'buy-sell/orders-transport-plan.md',  title: 'Orders (DO/SDO) и Transport Plan V2',                   parentId: TMS_ROOT },
];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mdToStorage(md) {
  let html = md;

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/\]\]>/g, ']]]]><![CDATA[>');
    return `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${lang || 'text'}</ac:parameter><ac:plain-text-body><![CDATA[${escaped}]]></ac:plain-text-body></ac:structured-macro>`;
  });

  html = html.replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_, header, rows) => {
    const ths = header.split('|').filter(c => c.trim()).map(c => `<th><p>${esc(c.trim())}</p></th>`).join('');
    const trs = rows.trim().split('\n').map(row => {
      const tds = row.split('|').slice(1, -1).map(c => `<td><p>${esc(c.trim())}</p></td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><tbody><tr>${ths}</tr>${trs}</tbody></table>`;
  });

  html = html.replace(/^#{4} (.+)$/gm, (_, t) => `<h4>${esc(t)}</h4>`);
  html = html.replace(/^#{3} (.+)$/gm, (_, t) => `<h3>${esc(t)}</h3>`);
  html = html.replace(/^#{2} (.+)$/gm, (_, t) => `<h2>${esc(t)}</h2>`);
  html = html.replace(/^# (.+)$/gm,    (_, t) => `<h1>${esc(t)}</h1>`);
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g,     '<em>$1</em>');
  html = html.replace(/`([^`\n]+)`/g,       '<code>$1</code>');
  html = html.replace(/^---+$/gm, '<hr/>');
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  html = html.replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${esc(l.replace(/^[-*] /, '').trim())}</li>`).join('');
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${esc(l.replace(/^\d+\. /, '').trim())}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  html = html.split('\n').map(line => {
    const t = line.trim();
    if (!t) return '';
    if (/^<[a-zA-Z]/.test(t)) return t;
    return `<p>${t}</p>`;
  }).join('\n');

  return html;
}

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: HOST,
      path: urlPath,
      method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function findPage(title, parentId) {
  const r = await request('GET', `/wiki/rest/api/content?spaceKey=${SPACE}&title=${encodeURIComponent(title)}&expand=version`);
  const results = r.body.results || [];
  return results.find(p => p.ancestors?.some(a => a.id === parentId) || results.length === 1) || results[0] || null;
}

async function createPage(title, parentId, storageBody) {
  return request('POST', '/wiki/rest/api/content', {
    type: 'page',
    title,
    space: { key: SPACE },
    ancestors: [{ id: parentId }],
    body: { storage: { value: storageBody, representation: 'storage' } },
  });
}

async function updatePage(pageId, title, version, storageBody) {
  return request('PUT', `/wiki/rest/api/content/${pageId}`, {
    type: 'page',
    title,
    version: { number: version + 1 },
    body: { storage: { value: storageBody, representation: 'storage' } },
  });
}

async function main() {
  console.log(`Publishing ${BATCH.length} docs to Confluence...\n`);
  for (const { file, title, parentId } of BATCH) {
    const filePath = path.join(DOCS_ROOT, file);
    const md = fs.readFileSync(filePath, 'utf8');
    const storage = mdToStorage(md);

    const existing = await findPage(title, parentId);
    let result;
    if (existing) {
      result = await updatePage(existing.id, title, existing.version.number, storage);
      console.log(`✏️  Updated  [${result.body.id}] ${title}`);
    } else {
      result = await createPage(title, parentId, storage);
      if (result.status === 200 || result.status === 201) {
        console.log(`✅ Created  [${result.body.id}] ${title}`);
      } else {
        console.log(`❌ FAILED   ${title} — HTTP ${result.status}`);
        console.log(JSON.stringify(result.body).slice(0, 300));
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('\nDone.');
}

main().catch(console.error);
