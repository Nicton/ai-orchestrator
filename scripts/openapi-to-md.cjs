/**
 * openapi-to-md — generate searchable Markdown reference + graph endpoint list
 * from the split OpenAPI 3.0.2 spec in workspaces/public-api-docs/swagger/.
 *
 * Output:
 *   workspaces/documentation/product/integrations/public-api/reference/<resource>.md
 *   workspaces/documentation/product/integrations/public-api/reference/README.md
 *   workspaces/documentation/product/tools/public-api-endpoints.json   (for build-graph)
 *
 * No external deps — a minimal $ref resolver (file-relative + JSON-pointer).
 * Run:  node scripts/openapi-to-md.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SWAGGER = path.join(ROOT, 'workspaces/public-api-docs/swagger');
const API = path.join(SWAGGER, 'api.json');
const OUT_DIR = path.join(ROOT, 'workspaces/documentation/product/integrations/public-api/reference');
const ENDPOINTS_JSON = path.join(ROOT, 'workspaces/documentation/product/tools/public-api-endpoints.json');

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

// ---- minimal $ref resolver ------------------------------------------------
const fileCache = new Map();
function loadFile(abs) {
  if (fileCache.has(abs)) return fileCache.get(abs);
  const json = JSON.parse(fs.readFileSync(abs, 'utf8'));
  fileCache.set(abs, json);
  return json;
}
function jsonPointer(doc, pointer) {
  if (!pointer) return doc;
  const parts = pointer.replace(/^#?\//, '').split('/').map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  let cur = doc;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
// resolve a single $ref → { node, base } where base is the file the node came from
function resolveRef(baseAbs, ref) {
  const [filePart, pointer] = ref.split('#');
  let targetAbs = baseAbs;
  if (filePart) targetAbs = path.resolve(path.dirname(baseAbs), filePart);
  const doc = loadFile(targetAbs);
  return { node: jsonPointer(doc, pointer || ''), base: targetAbs };
}
// dereference top-level $ref of a node (one hop, following chains)
function deref(node, base, seen = 0) {
  if (!node || typeof node !== 'object' || seen > 20) return { node, base };
  if (node.$ref) {
    const r = resolveRef(base, node.$ref);
    return deref(r.node, r.base, seen + 1);
  }
  return { node, base };
}
// short schema name from a $ref (last meaningful segment)
function refName(ref) {
  const [filePart, pointer] = ref.split('#');
  if (pointer) {
    const segs = pointer.split('/').filter(Boolean);
    return segs[segs.length - 1];
  }
  // file ref like schemas/allowed-account/index.json → allowed-account
  const segs = filePart.replace(/\.json$/, '').split('/').filter(Boolean);
  const last = segs[segs.length - 1];
  return last === 'index' ? segs[segs.length - 2] || last : last;
}

// ---- schema → compact markdown -------------------------------------------
function schemaType(s, base) {
  if (!s) return '—';
  if (s.$ref) return refName(s.$ref);
  if (s.type === 'array') {
    const it = s.items || {};
    const inner = it.$ref ? refName(it.$ref) : (it.type || 'object');
    return `array<${inner}>`;
  }
  if (s.enum) return `${s.type || 'string'} (enum: ${s.enum.slice(0, 8).join(', ')})`;
  return s.type || (s.properties ? 'object' : '—');
}
// list top-level properties of a (possibly $ref) schema, one level deep
function schemaProps(schemaNode, base) {
  const { node, base: b } = deref(schemaNode, base);
  if (!node || typeof node !== 'object') return [];
  let target = node;
  let tb = b;
  if (node.type === 'array' && node.items) {
    const d = deref(node.items, b);
    target = d.node; tb = d.base;
  }
  if (!target || !target.properties) return [];
  const required = new Set(target.required || []);
  return Object.entries(target.properties).map(([name, ps]) => ({
    name,
    type: schemaType(ps, tb),
    required: required.has(name),
    description: (ps && ps.description) ? String(ps.description).replace(/\s+/g, ' ').trim() : '',
  }));
}

function renderParams(params, base) {
  if (!params || !params.length) return '';
  const rows = [];
  for (const p0 of params) {
    const { node: p, base: pb } = deref(p0, base);
    if (!p || !p.name) continue;
    const type = schemaType(p.schema, pb);
    const req = p.required ? 'да' : 'нет';
    const desc = (p.description || (p.schema && p.schema.description) || '').replace(/\s+/g, ' ').trim();
    rows.push(`| \`${p.name}\` | ${p.in || ''} | ${type} | ${req} | ${desc} |`);
  }
  if (!rows.length) return '';
  return `\n**Параметры:**\n\n| Имя | В | Тип | Обяз. | Описание |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
}

function renderSchemaBlock(title, schemaNode, base) {
  if (!schemaNode) return '';
  const name = schemaNode.$ref ? refName(schemaNode.$ref) : schemaType(schemaNode, base);
  const props = schemaProps(schemaNode, base);
  let out = `\n**${title}:** \`${name}\`\n`;
  if (props.length) {
    out += `\n| Поле | Тип | Обяз. | Описание |\n|---|---|---|---|\n`;
    out += props.slice(0, 60).map((p) => `| \`${p.name}\` | ${p.type} | ${p.required ? 'да' : ''} | ${p.description} |`).join('\n') + '\n';
  }
  return out;
}

function renderRequestBody(rb, base) {
  if (!rb) return '';
  const { node, base: b } = deref(rb, base);
  if (!node || !node.content) return '';
  const ct = node.content['application/json'] || Object.values(node.content)[0];
  if (!ct || !ct.schema) return '';
  return renderSchemaBlock('Тело запроса', ct.schema, b);
}
function renderResponses(responses, base) {
  if (!responses) return '';
  let out = '\n**Ответы:**\n';
  for (const [code, r0] of Object.entries(responses)) {
    const { node: r, base: b } = deref(r0, base);
    const desc = (r && r.description) ? r.description.replace(/\s+/g, ' ').trim() : '';
    out += `\n- **${code}** — ${desc}`;
    const ct = r && r.content && (r.content['application/json'] || Object.values(r.content)[0]);
    if (ct && ct.schema) {
      const name = ct.schema.$ref ? refName(ct.schema.$ref) : schemaType(ct.schema, b);
      out += ` → \`${name}\``;
    }
  }
  return out + '\n';
}

// ---- main -----------------------------------------------------------------
const api = loadFile(API);
const securityNote = 'Аутентификация: заголовок `Authorization: Api-Key <key>` (схема `ApiKey`). Контекст аккаунта — заголовок `x-account-id`.';

// group endpoints by resource (first path segment, fallback to ref dir)
const byResource = {};
const allEndpoints = [];

for (const [pathStr, pathRef] of Object.entries(api.paths || {})) {
  let pathItem = pathRef;
  let base = API;
  if (pathRef && pathRef.$ref) {
    const r = resolveRef(API, pathRef.$ref);
    pathItem = r.node; base = r.base;
  }
  if (!pathItem) continue;
  // resource = first non-param path segment, else 'root'
  const seg = pathStr.split('/').filter((s) => s && !s.startsWith('{'))[0] || 'root';
  const resource = seg;
  for (const method of METHODS) {
    const op = pathItem[method];
    if (!op) continue;
    const summary = (op.summary || '').trim();
    (byResource[resource] = byResource[resource] || []).push({
      method: method.toUpperCase(), pathStr, summary, op, base,
    });
    allEndpoints.push({ method: method.toUpperCase(), path: pathStr, resource, summary });
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const resources = Object.keys(byResource).sort();
let totalEndpoints = 0;

for (const resource of resources) {
  const eps = byResource[resource].sort((a, b) => a.pathStr.localeCompare(b.pathStr) || a.method.localeCompare(b.method));
  totalEndpoints += eps.length;
  let md = `---\nsource_type: spec\n---\n# Public API — ${resource}\n\n`;
  md += `> Авто-сгенерировано из OpenAPI 3.0.2 (\`public-api-docs/swagger/api.json\`). Контракт публичного API Shiptify.\n`;
  md += `> Хостинг Swagger (по окружениям): BLU — https://api-docs.blu.shiptify.com/ · Flint — https://api-docs.flint.shiptify.com/ · прод — https://api-docs.shiptify.com/\n`;
  md += `> ${securityNote}\n\n`;
  md += `Эндпоинтов в ресурсе: **${eps.length}**.\n`;

  for (const e of eps) {
    md += `\n## ${e.method} ${e.pathStr}\n`;
    if (e.summary) md += `\n${e.summary}\n`;
    const tags = (e.op.tags || []).join(', ');
    if (tags) md += `\n*Тег:* ${tags}\n`;
    md += renderParams(e.op.parameters, e.base);
    md += renderRequestBody(e.op.requestBody, e.base);
    md += renderResponses(e.op.responses, e.base);
  }

  // graph metadata
  md += `\n---\n\n## 🔗 Граф-метаданные\n`;
  md += `- **id:** \`public-api.${resource}\`\n`;
  md += `- **type:** document · **domain:** Integrations · **status:** implemented\n`;
  md += `- **repo:** \`public-api-docs/swagger/paths/${resource}\`\n`;
  md += `- **modules:** Integrations\n`;
  md += `- **references:** integrations.public-api\n`;
  fs.writeFileSync(path.join(OUT_DIR, `${resource}.md`), md);
}

// index README
let idx = `---\nsource_type: spec\n---\n# Public API — Справочник эндпоинтов (OpenAPI)\n\n`;
idx += `> Полный машинно-сгенерированный справочник публичного API Shiptify из OpenAPI 3.0.2.\n`;
idx += `> Источник контракта: \`public-api-docs/swagger/api.json\` (+ \`paths/\`, \`schemas/\`).\n\n`;
idx += `## Hosted Swagger UI\n\n`;
idx += `| Окружение | URL |\n|---|---|\n`;
idx += `| **BLU** (клиенты) | https://api-docs.blu.shiptify.com/ |\n`;
idx += `| Flint | https://api-docs.flint.shiptify.com/ |\n`;
idx += `| Прод | https://api-docs.shiptify.com/ |\n\n`;
idx += `${securityNote}\n\n`;
idx += `## Ресурсы (${resources.length}) — всего эндпоинтов: ${totalEndpoints}\n\n`;
idx += `| Ресурс | Эндпоинтов |\n|---|---|\n`;
for (const r of resources) idx += `| [${r}](${r}.md) | ${byResource[r].length} |\n`;
idx += `\n---\n\n## 🔗 Граф-метаданные\n`;
idx += `- **id:** \`public-api.reference\`\n`;
idx += `- **type:** document · **domain:** Integrations · **status:** implemented\n`;
idx += `- **repo:** \`public-api-docs/swagger/api.json\`\n`;
idx += `- **modules:** Integrations\n`;
idx += `- **references:** integrations.public-api\n`;
fs.writeFileSync(path.join(OUT_DIR, 'README.md'), idx);

// endpoints json for graph builder
fs.writeFileSync(ENDPOINTS_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), total: totalEndpoints, endpoints: allEndpoints }, null, 1));

console.log(`Generated ${resources.length} resource docs, ${totalEndpoints} endpoints → ${path.relative(ROOT, OUT_DIR)}`);
console.log(`Endpoint list → ${path.relative(ROOT, ENDPOINTS_JSON)}`);
