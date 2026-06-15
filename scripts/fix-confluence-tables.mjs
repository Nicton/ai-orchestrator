/**
 * Fix broken table formatting in Confluence.
 *
 * Root cause: in the OLD mdToStorage(), the table row regex used \s*\n?
 * which consumed blank lines after the last row, merging post-table text
 * onto the same line as </table> and losing the <p> wrapper.
 *
 * Fix: change \s*\n? → [ \t]*\n? in the row pattern so only horizontal
 * whitespace (spaces/tabs) is consumed before the optional newline.
 *
 * Usage: node scripts/fix-confluence-tables.mjs
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

// ── Pages to fix (ID → markdown file path relative to DOCS_ROOT) ─────────────
const PAGES = [
  // Batch 1 (session 2, first wave of new docs)
  { id: '622919682', file: 'features/multi-container.md',           title: 'Multi Container — Мульти-контейнерные бронирования' },
  { id: '622919699', file: 'features/sea-freight-ship-data.md',     title: 'Sea Freight — Данные судна (Ship Data)' },
  { id: '622952449', file: 'features/container-tracking.md',        title: 'Container Tracking — Отслеживание через Kpler' },
  { id: '622985217', file: 'features/retro-consolidation.md',       title: 'Retro Consolidation — Финансовая консолидация' },
  { id: '622723074', file: 'features/expected-orders.md',           title: 'Expected Orders (EO) — Ожидаемые заказы' },
  // Batch 2 (this session)
  { id: '622952482', file: 'features/doc-workflow.md',              title: 'Documents Workflow — Уведомления о документах' },
  { id: '622788611', file: 'features/visits-driver-data.md',        title: 'Visits — Expected vs Checked данные водителя' },
  { id: '622952499', file: 'features/labels-sscc.md',               title: 'Labels & SSCC — Штрихкоды и мульти-лейблы' },
  { id: '623116289', file: 'admin/navigation-account-types.md',     title: 'Навигация и типы аккаунтов' },
  { id: '623018019', file: 'rate-sheets/structure.md',              title: 'Rate Sheet — Структура и алгоритм сборки' },
  { id: '623149057', file: 'buy-sell/orders-transport-plan.md',     title: 'Orders (DO/SDO) и Transport Plan V2' },
  // Older pages from previous sessions
  { id: '610992133', file: 'buy-sell/README.md',                    title: 'Buy & Sell (TBS)' },
  { id: '610500628', file: 'slots/slotbook-carrier-selection.md',   title: 'Slotbook: Carrier Selection' },
  { id: '611057717', file: 'invoicing/invoice-line-improvements.md',title: 'Invoice Line Improvements' },
  { id: '611057683', file: 'buy-sell/selling-rate-sheet.md',        title: 'Selling Rate Sheet' },
  { id: '610598920', file: 'buy-sell/repeat-request.md',            title: 'Repeat Request' },
  { id: '610992150', file: 'buy-sell/send-quotes.md',               title: 'Send Quotes' },
  // OCR checklist — had raw markdown table
  { id: '621740053', file: 'shipments/16_checklist-tms-ocr.md',     title: 'TMS OCR — Account Functions, CO2 Widget, Dashboard, Shipment Card (54 пункта)' },
];

// ── FIXED mdToStorage ────────────────────────────────────────────────────────
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function processInline(text) {
  let s = esc(text.trim());
  // Bold before italic (greedy order matters)
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  // Strip markdown links, keep text
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return s;
}

function mdToStorage(md) {
  let html = md;

  // 1. Fenced code blocks → Confluence code macro
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/\]\]>/g, ']]]]><![CDATA[>');
    return `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${lang || 'text'}</ac:parameter><ac:plain-text-body><![CDATA[${escaped}]]></ac:plain-text-body></ac:structured-macro>`;
  });

  // 2. Tables — FIX: use [ \t]* instead of \s* to avoid consuming blank lines
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
    // Add trailing \n to ensure text after table gets its own line
    return `<table><tbody><tr>${ths}</tr>${trs}</tbody></table>\n`;
  });

  // 3. Headings
  html = html.replace(/^#{4} (.+)$/gm, (_, t) => `<h4>${esc(t)}</h4>`);
  html = html.replace(/^#{3} (.+)$/gm, (_, t) => `<h3>${esc(t)}</h3>`);
  html = html.replace(/^#{2} (.+)$/gm, (_, t) => `<h2>${esc(t)}</h2>`);
  html = html.replace(/^# (.+)$/gm,    (_, t) => `<h1>${esc(t)}</h1>`);

  // 4. Inline: bold, italic, code
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g,     '<em>$1</em>');
  html = html.replace(/`([^`\n]+)`/g,       '<code>$1</code>');

  // 5. Horizontal rules
  html = html.replace(/^---+$/gm, '<hr/>');

  // 6. Blockquotes
  html = html.replace(/^> (.+)$/gm, (_, t) => `<blockquote><p>${t}</p></blockquote>`);

  // 7. Bullet lists (grouped)
  html = html.replace(/((?:^[ \t]*[-*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l =>
      `<li>${l.replace(/^[ \t]*[-*] /, '').trim()}</li>`
    ).join('');
    return `<ul>${items}</ul>\n`;
  });

  // 8. Ordered lists (grouped)
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l =>
      `<li>${l.replace(/^\d+\. /, '').trim()}</li>`
    ).join('');
    return `<ol>${items}</ol>\n`;
  });

  // 9. Wrap remaining non-tag lines in <p>
  html = html.split('\n').map(line => {
    const t = line.trim();
    if (!t) return '';
    if (/^<[a-zA-Z/]/.test(t)) return t;
    return `<p>${t}</p>`;
  }).join('\n');

  return html;
}

// ── Confluence API helpers ───────────────────────────────────────────────────
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

async function getPage(id) {
  const r = await request('GET', `/wiki/rest/api/content/${id}?expand=version`);
  return r.body;
}

async function updatePage(id, title, version, storageBody) {
  return request('PUT', `/wiki/rest/api/content/${id}`, {
    type: 'page',
    title,
    version: { number: version + 1 },
    body: { storage: { value: storageBody, representation: 'storage' } },
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Fixing table formatting in ${PAGES.length} Confluence pages...\n`);
  let fixed = 0, skipped = 0, errors = 0;

  for (const { id, file, title } of PAGES) {
    const filePath = path.join(DOCS_ROOT, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skip [${id}] — file not found: ${file}`);
      skipped++;
      continue;
    }

    const md = fs.readFileSync(filePath, 'utf8');
    const storage = mdToStorage(md);

    // Get current version
    const page = await getPage(id);
    if (!page.version) {
      console.log(`⚠️  Skip [${id}] — cannot get version`);
      skipped++;
      continue;
    }

    const result = await updatePage(id, title, page.version.number, storage);
    if (result.status === 200 || result.status === 201) {
      console.log(`✅ Fixed  [${id}] ${title}`);
      fixed++;
    } else {
      console.log(`❌ Error  [${id}] ${title} — HTTP ${result.status}: ${JSON.stringify(result.body).slice(0,200)}`);
      errors++;
    }

    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nDone: ${fixed} fixed, ${skipped} skipped, ${errors} errors`);
}

main().catch(console.error);
