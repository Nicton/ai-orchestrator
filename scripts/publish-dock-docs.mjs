/**
 * Publish DOCK module feature docs to Confluence.
 * Creates a "DOCK — Внутренняя документация" parent page under TMS root,
 * then publishes 4 new feature doc files.
 *
 * Usage: node scripts/publish-dock-docs.mjs
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
const TMS_ROOT = '609583105'; // TMS Внутренняя документация

if (!EMAIL || !TOKEN) {
  throw new Error('Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script.');
}

const AUTH = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');
const DOCS_ROOT = path.resolve(__dirname, '../workspaces/documentation/product/dock/feature-docs');

// ── Batch: 4 new DOCK feature docs ───────────────────────────────────────────
// DOCK_PARENT will be resolved at runtime (created or found)
const BATCH = [
  { file: 'dock-orders/README.md',      title: 'DOCK — Dock Orders: листинг и мульти-клиент' },
  { file: 'partner-db/README.md',       title: 'DOCK — Partner DB: роли SELLER/BUYER/BOOKER' },
  { file: 'slotify-ui3/README.md',      title: 'DOCK — Slotify UI 3.0/3.1: редизайн публичного портала' },
  { file: 'visits-management/README.md',title: 'DOCK — Visits: управление визитами и статусами' },
];

// ── FIXED mdToStorage (with processInline for table cells) ───────────────────
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function processInline(text) {
  let s = esc(text.trim());
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return s;
}

function mdToStorage(md) {
  let html = md;

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/\]\]>/g, ']]]]><![CDATA[>');
    return `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${lang || 'text'}</ac:parameter><ac:plain-text-body><![CDATA[${escaped}]]></ac:plain-text-body></ac:structured-macro>`;
  });

  // FIX: [ \t]* instead of \s* to avoid consuming blank lines after table
  html = html.replace(/^\|(.+)\|[ \t]*\n\|[-| :]+\|[ \t]*\n((?:\|.+\|[ \t]*\n?)*)/gm, (_, header, rows) => {
    const ths = header.split('|').filter(c => c.trim()).map(c =>
      `<th><p>${processInline(c)}</p></th>`
    ).join('');
    const trs = rows.trim().split('\n').filter(r => r.trim()).map(row => {
      const tds = row.split('|').slice(1, -1).map(c =>
        `<td><p>${processInline(c)}</p></td>`
      ).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><tbody><tr>${ths}</tr>${trs}</tbody></table>\n`;
  });

  html = html.replace(/^#{4} (.+)$/gm, (_, t) => `<h4>${esc(t)}</h4>`);
  html = html.replace(/^#{3} (.+)$/gm, (_, t) => `<h3>${esc(t)}</h3>`);
  html = html.replace(/^#{2} (.+)$/gm, (_, t) => `<h2>${esc(t)}</h2>`);
  html = html.replace(/^# (.+)$/gm,    (_, t) => `<h1>${esc(t)}</h1>`);
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g,     '<em>$1</em>');
  html = html.replace(/`([^`\n]+)`/g,       '<code>$1</code>');
  html = html.replace(/^---+$/gm, '<hr/>');
  html = html.replace(/^> (.+)$/gm, (_, t) => `<blockquote><p>${t}</p></blockquote>`);

  html = html.replace(/((?:^[ \t]*[-*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l =>
      `<li>${l.replace(/^[ \t]*[-*] /, '').trim()}</li>`
    ).join('');
    return `<ul>${items}</ul>\n`;
  });
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l =>
      `<li>${l.replace(/^\d+\. /, '').trim()}</li>`
    ).join('');
    return `<ol>${items}</ol>\n`;
  });

  html = html.split('\n').map(line => {
    const t = line.trim();
    if (!t) return '';
    if (/^<[a-zA-Z/]/.test(t)) return t;
    return `<p>${t}</p>`;
  }).join('\n');

  return html;
}

// ── Confluence API ─────────────────────────────────────────────────────────────
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

async function findPageByTitle(title, parentId) {
  const r = await request('GET', `/wiki/rest/api/content?spaceKey=${SPACE}&title=${encodeURIComponent(title)}&expand=version,ancestors`);
  const results = r.body.results || [];
  if (parentId) {
    return results.find(p => p.ancestors?.some(a => a.id === parentId)) || results[0] || null;
  }
  return results[0] || null;
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

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Step 1: Ensure DOCK parent page exists
  const DOCK_PARENT_TITLE = 'DOCK — Внутренняя документация';
  console.log(`\nLooking for DOCK parent page "${DOCK_PARENT_TITLE}"...`);

  let dockParentId;
  const existingParent = await findPageByTitle(DOCK_PARENT_TITLE, TMS_ROOT);
  if (existingParent) {
    dockParentId = existingParent.id;
    console.log(`  Found [${dockParentId}] ${DOCK_PARENT_TITLE}`);
  } else {
    const overview = `<p>Внутренняя документация модуля DOCK: ворота склада, слоты, визиты, Slotify, Dock Orders и Partner DB.</p>`;
    const r = await createPage(DOCK_PARENT_TITLE, TMS_ROOT, overview);
    if (r.status === 200 || r.status === 201) {
      dockParentId = r.body.id;
      console.log(`  Created [${dockParentId}] ${DOCK_PARENT_TITLE}`);
    } else {
      console.error(`  ERROR creating parent: HTTP ${r.status}`, JSON.stringify(r.body).slice(0, 300));
      process.exit(1);
    }
  }
  await new Promise(r => setTimeout(r, 500));

  // Step 2: Publish each doc file
  console.log(`\nPublishing ${BATCH.length} DOCK feature docs...\n`);
  for (const { file, title } of BATCH) {
    const filePath = path.join(DOCS_ROOT, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skip [${title}] — file not found: ${file}`);
      continue;
    }

    const md = fs.readFileSync(filePath, 'utf8');
    const storage = mdToStorage(md);

    const existing = await findPageByTitle(title, dockParentId);
    let result;
    if (existing) {
      result = await updatePage(existing.id, title, existing.version.number, storage);
      const id = result.body?.id || existing.id;
      console.log(result.status === 200 || result.status === 201
        ? `✏️  Updated  [${id}] ${title}`
        : `❌ Error updating [${existing.id}] HTTP ${result.status}: ${JSON.stringify(result.body).slice(0, 200)}`);
    } else {
      result = await createPage(title, dockParentId, storage);
      console.log(result.status === 200 || result.status === 201
        ? `✅ Created  [${result.body.id}] ${title}`
        : `❌ Error creating ${title} — HTTP ${result.status}: ${JSON.stringify(result.body).slice(0, 200)}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\nDone. DOCK parent:', dockParentId);
}

main().catch(console.error);
