/**
 * Publish Identity and Chat module READMEs to Confluence.
 * Creates parent pages under TMS root then publishes the README files.
 *
 * Usage: node scripts/publish-identity-chat-docs.mjs
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

const AUTH = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');
const DOCS_ROOT = path.resolve(__dirname, '../workspaces/documentation/product');

const MODULES = [
  {
    parentTitle: 'Identity / Auth — Внутренняя документация',
    pages: [
      { file: 'identity/README.md', title: 'Identity — ms-auth: JWT, SAML/SSO, роли и ACL' },
    ],
  },
  {
    parentTitle: 'Chat / Messaging — Внутренняя документация',
    pages: [
      { file: 'chat/README.md', title: 'Chat — Сообщения, WebSocket и уведомления' },
    ],
  },
];

// ── Fixed mdToStorage ────────────────────────────────────────────────────────
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

async function findPageByTitle(title) {
  const r = await request('GET', `/wiki/rest/api/content?spaceKey=${SPACE}&title=${encodeURIComponent(title)}&expand=version`);
  return (r.body.results || [])[0] || null;
}

async function createPage(title, parentId, storageBody) {
  return request('POST', '/wiki/rest/api/content', {
    type: 'page', title,
    space: { key: SPACE },
    ancestors: [{ id: parentId }],
    body: { storage: { value: storageBody, representation: 'storage' } },
  });
}

async function updatePage(pageId, title, version, storageBody) {
  return request('PUT', `/wiki/rest/api/content/${pageId}`, {
    type: 'page', title,
    version: { number: version + 1 },
    body: { storage: { value: storageBody, representation: 'storage' } },
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  for (const { parentTitle, pages } of MODULES) {
    console.log(`\n── ${parentTitle} ──`);

    // Ensure parent exists
    let parentId;
    const existingParent = await findPageByTitle(parentTitle);
    if (existingParent) {
      parentId = existingParent.id;
      console.log(`  Parent found [${parentId}]`);
    } else {
      const r = await createPage(parentTitle, TMS_ROOT, `<p>Внутренняя документация модуля.</p>`);
      if (r.status === 200 || r.status === 201) {
        parentId = r.body.id;
        console.log(`  Parent created [${parentId}]`);
      } else {
        console.error(`  ERROR creating parent: HTTP ${r.status}`, JSON.stringify(r.body).slice(0, 200));
        continue;
      }
    }
    await new Promise(r => setTimeout(r, 400));

    // Publish each page
    for (const { file, title } of pages) {
      const filePath = path.join(DOCS_ROOT, file);
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  Skip ${title} — file not found: ${file}`);
        continue;
      }
      const md = fs.readFileSync(filePath, 'utf8');
      const storage = mdToStorage(md);

      const existing = await findPageByTitle(title);
      let result;
      if (existing) {
        result = await updatePage(existing.id, title, existing.version.number, storage);
        const id = result.body?.id || existing.id;
        console.log(result.status === 200 || result.status === 201
          ? `  ✏️  Updated  [${id}] ${title}`
          : `  ❌ Error updating HTTP ${result.status}`);
      } else {
        result = await createPage(title, parentId, storage);
        console.log(result.status === 200 || result.status === 201
          ? `  ✅ Created  [${result.body.id}] ${title}`
          : `  ❌ Error creating HTTP ${result.status}: ${JSON.stringify(result.body).slice(0, 200)}`);
      }
      await new Promise(r => setTimeout(r, 400));
    }
  }
  console.log('\nDone.');
}

main().catch(console.error);
