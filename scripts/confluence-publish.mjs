/**
 * Confluence publisher: converts markdown files to Confluence storage format
 * and creates/updates pages via REST API.
 *
 * Usage:
 *   node scripts/confluence-publish.mjs <markdownFile> <pageTitle> <parentId>
 *   node scripts/confluence-publish.mjs --batch   (publishes all TMS shipments docs)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

// ── Config ────────────────────────────────────────────────────────────────────
const EMAIL    = process.env.ATLASSIAN_EMAIL || ';
const TOKEN    = process.env.ATLASSIAN_TOKEN || ';

if (!EMAIL || !TOKEN) {
  throw new Error('Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script.');
}
const HOST     = 'shiptify.atlassian.net';
const SPACE    = 'TD';
const SHIPMENTS_ID = '609746945'; // Shipments — Перевозки page

const AUTH = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

const DOCS_ROOT = path.resolve('workspaces/documentation/product/tms/shipments');

// ── Batch plan ────────────────────────────────────────────────────────────────
// parentId: direct ID | parentTitle: find by title under SHIPMENTS_ID
const BATCH = [
  // Domain map (new page)
  { file: '00_domain-map.md', title: 'Domain Map — Shipments', parentId: SHIPMENTS_ID },
  // State machine (update existing "Стейт-машина" page ID=609222658)
  { file: '04_state-machine.md', title: 'Стейт-машина', updateId: '609222658' },
  // List page — update existing "Список перевозок" ID=609288194
  { file: '01_list/README.md',         title: 'Список перевозок — Overview',      updateId: '609288194' },
  // List sub-pages (new, children of 609288194)
  { file: '01_list/filters.md',        title: 'Список перевозок — Filters',       parentId: '609288194' },
  { file: '01_list/table-columns.md',  title: 'Список перевозок — Table Columns', parentId: '609288194' },
  { file: '01_list/actions.md',        title: 'Список перевозок — Actions',       parentId: '609288194' },
  { file: '01_list/api.md',            title: 'Список перевозок — API',           parentId: '609288194' },
];

// ── Markdown → Confluence storage format ──────────────────────────────────────
function mdToStorage(md) {
  let html = md;

  // Fenced code blocks → Confluence code macro
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langAttr = lang ? ` ac:language="${lang}"` : '';
    const escaped = code.replace(/\]\]>/g, ']]]]><![CDATA[>');
    return `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${lang || 'text'}</ac:parameter><ac:plain-text-body><![CDATA[${escaped}]]></ac:plain-text-body></ac:structured-macro>`;
  });

  // Tables
  html = html.replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_, header, rows) => {
    const ths = header.split('|').filter(c => c.trim()).map(c => `<th><p>${escape(c.trim())}</p></th>`).join('');
    const trs = rows.trim().split('\n').map(row => {
      const tds = row.split('|').filter(c => c.trim() !== undefined).slice(1, -1)
        .map(c => `<td><p>${escape(c.trim())}</p></td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><tbody><tr>${ths}</tr>${trs}</tbody></table>`;
  });

  // Headers
  html = html.replace(/^#{4} (.+)$/gm, (_, t) => `<h4>${escape(t)}</h4>`);
  html = html.replace(/^#{3} (.+)$/gm, (_, t) => `<h3>${escape(t)}</h3>`);
  html = html.replace(/^#{2} (.+)$/gm, (_, t) => `<h2>${escape(t)}</h2>`);
  html = html.replace(/^# (.+)$/gm,    (_, t) => `<h1>${escape(t)}</h1>`);

  // Bold / italic / inline code
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g,     '<em>$1</em>');
  html = html.replace(/`([^`\n]+)`/g,       '<code>$1</code>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr/>');

  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // Unordered lists (multi-line)
  html = html.replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${escape(l.replace(/^[-*] /, '').trim())}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${escape(l.replace(/^\d+\. /, '').trim())}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs (lines not already wrapped in tags)
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (/^<[a-zA-Z]/.test(trimmed)) return trimmed; // already a tag
    return `<p>${trimmed}</p>`;
  }).join('\n');

  return html;
}

function escape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Confluence API helpers ────────────────────────────────────────────────────
function apiRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: HOST,
      path: `/wiki/rest/api${apiPath}`,
      method,
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || raw.slice(0, 200)}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Non-JSON response (${res.statusCode}): ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function findPage(title, parentId) {
  const encoded = encodeURIComponent(title);
  const res = await apiRequest('GET',
    `/content?spaceKey=${SPACE}&title=${encoded}&expand=version,ancestors`);
  const pages = res.results || [];
  if (!parentId) return pages[0] || null;
  return pages.find(p => p.ancestors?.some(a => a.id === parentId)) || pages[0] || null;
}

async function createPage(title, parentId, storageContent) {
  return apiRequest('POST', '/content', {
    type: 'page',
    title,
    space: { key: SPACE },
    ancestors: [{ id: parentId }],
    body: { storage: { value: storageContent || `<p><em>Content coming soon.</em></p>`, representation: 'storage' } },
  });
}

async function updatePage(pageId, title, version, storageContent) {
  return apiRequest('PUT', `/content/${pageId}`, {
    type: 'page',
    title,
    version: { number: version + 1 },
    body: { storage: { value: storageContent, representation: 'storage' } },
  });
}

async function ensurePage(title, parentId, storageContent) {
  let page = await findPage(title, parentId);
  if (page) {
    console.log(`  ↻ Updating: "${title}" (id=${page.id})`);
    await updatePage(page.id, title, page.version.number, storageContent || `<p><em>Content coming soon.</em></p>`);
    return page.id;
  } else {
    console.log(`  + Creating: "${title}"`);
    const created = await createPage(title, parentId, storageContent);
    return created.id;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📄 Confluence Publisher — TMS Shipments\n');

  for (const item of BATCH) {
    // Build content
    let storageContent = '<p><em>Content coming soon.</em></p>';
    if (item.file) {
      const filePath = path.join(DOCS_ROOT, item.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`  ⚠ File not found, skipping: ${filePath}`);
        continue;
      }
      const md = fs.readFileSync(filePath, 'utf8');
      storageContent = mdToStorage(md);
    }

    // Direct update by ID
    if (item.updateId) {
      console.log(`  ↻ Updating existing page: "${item.title}" (id=${item.updateId})`);
      const existing = await apiRequest('GET', `/content/${item.updateId}?expand=version`);
      await updatePage(item.updateId, item.title, existing.version.number, storageContent);
      console.log(`    → updated id=${item.updateId}\n`);
      continue;
    }

    // Create or update under parentId
    const pageId = await ensurePage(item.title, item.parentId, storageContent);
    console.log(`    → id=${pageId}\n`);
  }

  console.log('✅ Done!');
}

main().catch(err => { console.error('✗', err.message); process.exit(1); });
