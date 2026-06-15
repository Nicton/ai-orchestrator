/**
 * One-time publisher: 8 new feature docs + OPEN-QUESTIONS.md → Confluence
 * Usage: node scripts/publish-new-docs.mjs
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EMAIL    = process.env.ATLASSIAN_EMAIL || '';
const TOKEN    = process.env.ATLASSIAN_TOKEN || '';
const HOST     = 'shiptify.atlassian.net';
const SPACE    = 'TD';
const TMS_ROOT = '609583105';      // TMS Внутренняя документация
const SHIPS_ID = '609746945';      // Shipments — Перевозки

if (!EMAIL || !TOKEN) {
  throw new Error('Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script.');
}

const AUTH = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');
const DOCS_ROOT = path.resolve(__dirname, '../workspaces/documentation/product/tms');

// Files to publish
const BATCH = [
  // Features → under Shipments section
  { file: 'features/multi-container.md',        title: 'Multi Container — Мульти-контейнерные бронирования', parentId: SHIPS_ID },
  { file: 'features/sea-freight-ship-data.md',  title: 'Sea Freight — Данные судна (Ship Data)',              parentId: SHIPS_ID },
  { file: 'features/container-tracking.md',     title: 'Container Tracking — Отслеживание через Kpler',       parentId: SHIPS_ID },
  { file: 'features/retro-consolidation.md',    title: 'Retro Consolidation — Финансовая консолидация',       parentId: SHIPS_ID },
  { file: 'features/expected-orders.md',        title: 'Expected Orders (EO) — Ожидаемые заказы',            parentId: SHIPS_ID },
  { file: 'features/quota-management.md',       title: 'Quota Management — Управление квотами',              parentId: SHIPS_ID },
  { file: 'features/pallets.md',                title: 'Pallets Management — Управление поддонами',          parentId: SHIPS_ID },
  // Admin → under TMS root
  { file: 'admin/auth-sso.md',                  title: 'Auth / SSO — Аутентификация и единый вход',           parentId: TMS_ROOT },
  // Open questions → under TMS root
  { file: 'OPEN-QUESTIONS.md',                  title: 'Открытые вопросы — TMS Documentation Gaps',           parentId: TMS_ROOT },
];

// ── Markdown → Confluence storage ────────────────────────────────────────────
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

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function apiRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: HOST,
      path: `/wiki/rest/api${apiPath}`,
      method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || raw.slice(0,200)}`));
          else resolve(parsed);
        } catch { reject(new Error(`Non-JSON (${res.statusCode}): ${raw.slice(0,200)}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function findPage(title, parentId) {
  const res = await apiRequest('GET', `/content?spaceKey=${SPACE}&title=${encodeURIComponent(title)}&expand=version,ancestors`);
  const pages = res.results || [];
  return pages.find(p => p.ancestors?.some(a => a.id === parentId)) || pages[0] || null;
}

async function createPage(title, parentId, content) {
  return apiRequest('POST', '/content', {
    type: 'page', title, space: { key: SPACE },
    ancestors: [{ id: parentId }],
    body: { storage: { value: content, representation: 'storage' } },
  });
}

async function updatePage(id, title, version, content) {
  return apiRequest('PUT', `/content/${id}`, {
    type: 'page', title,
    version: { number: version + 1 },
    body: { storage: { value: content, representation: 'storage' } },
  });
}

async function main() {
  console.log('📄 Publishing new TMS docs to Confluence...\n');
  const results = [];

  for (const item of BATCH) {
    const filePath = path.join(DOCS_ROOT, item.file);
    if (!fs.existsSync(filePath)) { console.warn(`  ⚠ Not found: ${filePath}`); continue; }
    const md = fs.readFileSync(filePath, 'utf8');
    const content = mdToStorage(md);

    const existing = await findPage(item.title, item.parentId);
    let pageId;
    if (existing) {
      console.log(`  ↻ Updating: "${item.title}" (${existing.id})`);
      await updatePage(existing.id, item.title, existing.version.number, content);
      pageId = existing.id;
    } else {
      console.log(`  + Creating: "${item.title}"`);
      const created = await createPage(item.title, item.parentId, content);
      pageId = created.id;
    }
    console.log(`    → https://shiptify.atlassian.net/wiki/spaces/TD/pages/${pageId}\n`);
    results.push({ title: item.title, id: pageId });
  }

  console.log('✅ Done! Published pages:');
  results.forEach(r => console.log(`  - ${r.title}: /wiki/spaces/TD/pages/${r.id}`));
}

main().catch(err => { console.error('✗', err.message); process.exit(1); });
