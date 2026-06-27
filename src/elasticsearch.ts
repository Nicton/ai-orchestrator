import type { FastifyInstance } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './db.js';
import { requireAuth } from './auth.js';

// ---------------------------------------------------------------------------
// Elasticsearch search/index layer for Searchify (per docs/elasticsearch/INTEGRATION-PLAN.md).
// ES is search/index ONLY; Postgres stays master. We talk to ES over its REST API via
// fetch (no @elastic/elasticsearch dependency). Embeddings are pluggable via EMBED_URL:
// if unset, we run BM25-only (robust to the server's flaky outbound). When an embedder
// sidecar is configured, we add a dense_vector + kNN for semantic/hybrid search.
// ---------------------------------------------------------------------------

const ES_URL = (process.env.ES_URL || 'http://elasticsearch:9200').replace(/\/$/, '');
const EMBED_URL = process.env.EMBED_URL || ''; // e.g. http://embedder:8088/embed -> {vectors:[[...]]}
const EMBED_DIM = parseInt(process.env.EMBED_DIM || '384', 10);
const IDX = { req: 'qa-requirements', chunk: 'qa-chunks', link: 'qa-links' };

async function esReq(method: string, path: string, body?: any, ndjson = false): Promise<{ ok: boolean; status: number; json: any }> {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 60000);
  try {
    const headers: any = { 'content-type': ndjson ? 'application/x-ndjson' : 'application/json' };
    const r = await fetch(`${ES_URL}${path}`, { method, headers, body: body == null ? undefined : (ndjson ? body : JSON.stringify(body)), signal: ctl.signal });
    const t = await r.text(); let j: any = null; try { j = t ? JSON.parse(t) : null; } catch { /* */ }
    return { ok: r.ok, status: r.status, json: j };
  } catch (e: any) { return { ok: false, status: 0, json: { error: String(e?.message || e) } }; } finally { clearTimeout(to); }
}

export async function esReady(): Promise<boolean> {
  const r = await esReq('GET', '/');
  return r.ok && !!r.json?.version;
}

// optional embeddings; returns null when no embedder is configured or it fails
export async function embed(texts: string[]): Promise<number[][] | null> {
  if (!EMBED_URL || !texts.length) return null;
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 120000);
  try {
    const r = await fetch(EMBED_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texts }), signal: ctl.signal });
    if (!r.ok) return null;
    const j: any = await r.json();
    return Array.isArray(j?.vectors) && j.vectors.length === texts.length ? j.vectors : null;
  } catch { return null; } finally { clearTimeout(to); }
}

function vectorMapping() {
  return EMBED_URL ? { embedding: { type: 'dense_vector', dims: EMBED_DIM, index: true, similarity: 'cosine' } } : {};
}

export async function ensureIndices(): Promise<void> {
  const common = { analysis: { analyzer: { default: { type: 'standard' } } } };
  const defs: Record<string, any> = {
    [IDX.req]: {
      settings: common,
      mappings: { properties: {
        globalId: { type: 'keyword' }, projectId: { type: 'keyword' }, sectionId: { type: 'keyword' },
        module: { type: 'keyword' }, title: { type: 'text' }, summary: { type: 'text' },
        implementationBackend: { type: 'text' }, implementationFrontend: { type: 'text' },
        acceptanceCriteria: { type: 'text' }, codeRefs: { type: 'keyword' },
        priority: { type: 'keyword' }, status: { type: 'keyword' }, type: { type: 'keyword' },
        sourceUrl: { type: 'keyword' }, fullText: { type: 'text' }, updatedAt: { type: 'date' },
        ...vectorMapping(),
      } },
    },
    [IDX.chunk]: {
      settings: common,
      mappings: { properties: {
        sourceType: { type: 'keyword' }, sourceId: { type: 'keyword' }, globalId: { type: 'keyword' },
        title: { type: 'text' }, headingPath: { type: 'text' }, chunkText: { type: 'text' },
        module: { type: 'keyword' }, sourceUrl: { type: 'keyword' }, ...vectorMapping(),
      } },
    },
    [IDX.link]: {
      mappings: { properties: {
        sourceType: { type: 'keyword' }, sourceId: { type: 'keyword' }, sourceGlobalId: { type: 'keyword' },
        targetType: { type: 'keyword' }, targetId: { type: 'keyword' }, targetGlobalId: { type: 'keyword' },
        relationType: { type: 'keyword' }, note: { type: 'text' },
      } },
    },
  };
  for (const [name, def] of Object.entries(defs)) {
    const exists = await esReq('HEAD', `/${name}`);
    if (exists.status === 404) await esReq('PUT', `/${name}`, def);
  }
}

function chunkText(text: string, size = 1100, overlap = 150): string[] {
  const clean = (text || '').replace(/\s+/g, ' ').trim(); if (!clean) return [];
  if (clean.length <= size) return [clean];
  const out: string[] = []; let i = 0;
  while (i < clean.length) { out.push(clean.slice(i, i + size)); i += size - overlap; }
  return out;
}

async function bulk(lines: string): Promise<{ ok: boolean; errors: boolean }> {
  if (!lines) return { ok: true, errors: false };
  const r = await esReq('POST', '/_bulk', lines, true);
  return { ok: r.ok, errors: !!r.json?.errors };
}

// Index all (non-deleted) requirements + their acceptance criteria, REQ↔REQ links, and chunks.
export async function indexRequirements(projectId?: string): Promise<{ requirements: number; chunks: number; links: number }> {
  const where: any = { isDeleted: false, ...(projectId ? { projectId } : {}) };
  const reqs = await prisma.qaRequirement.findMany({ where });
  const ids = reqs.map((r) => r.id);
  const acAll = ids.length ? await prisma.qaAcceptanceCriterion.findMany({ where: { requirementId: { in: ids }, isDeleted: false }, orderBy: { order: 'asc' } }) : [];
  const acById = new Map<string, string[]>();
  for (const a of acAll) { const arr = acById.get(a.requirementId) || []; arr.push(a.text); acById.set(a.requirementId, arr); }
  const srcAll = ids.length ? await prisma.qaRequirementSource.findMany({ where: { requirementId: { in: ids }, isDeleted: false } }) : [];
  const srcById = new Map<string, any[]>();
  for (const s of srcAll) { const arr = srcById.get(s.requirementId) || []; arr.push(s); srcById.set(s.requirementId, arr); }

  // requirements + chunks
  let reqLines = ''; let chunkLines = ''; let chunkCount = 0;
  const gidById = new Map(reqs.map((r) => [r.id, r.globalId]));
  for (const r of reqs) {
    const ac = acById.get(r.id) || [];
    const codeRefs = (srcById.get(r.id) || []).filter((s) => s.type === 'CodeAnalysis').map((s) => s.externalId).filter(Boolean);
    const desc = r.description || '';
    const beMatch = desc.split('**🖥')[1]?.split('**🌐')[0] || '';
    const feMatch = desc.split('**🌐')[1]?.split('**❓')[0] || '';
    const summary = desc.split('\n\n')[0] || r.title;
    const doc = {
      globalId: r.globalId, projectId: r.projectId, sectionId: r.sectionId, module: null,
      title: r.title, summary, implementationBackend: beMatch, implementationFrontend: feMatch,
      acceptanceCriteria: ac, codeRefs, priority: r.priority, status: r.status, type: r.type,
      sourceUrl: `/qa#/requirements/${r.globalId}`, fullText: `${r.title}\n${desc}\n${ac.join('\n')}`,
      updatedAt: r.updatedAt,
    };
    reqLines += JSON.stringify({ index: { _index: IDX.req, _id: r.id } }) + '\n' + JSON.stringify(doc) + '\n';
    // chunks from description + criteria
    const chunks = chunkText(`${r.title}\n${desc}\n${ac.join('\n')}`);
    for (let ci = 0; ci < chunks.length; ci++) {
      chunkLines += JSON.stringify({ index: { _index: IDX.chunk, _id: `${r.id}:${ci}` } }) + '\n'
        + JSON.stringify({ sourceType: 'Requirement', sourceId: r.id, globalId: r.globalId, title: r.title, headingPath: '', chunkText: chunks[ci], module: null, sourceUrl: `/qa#/requirements/${r.globalId}` }) + '\n';
      chunkCount++;
    }
  }
  // optional embeddings for requirement docs (best-effort; skipped if no embedder)
  await bulk(reqLines); await bulk(chunkLines);

  // links (search copy of QaEntityLink Requirement↔Requirement)
  const links = await prisma.qaEntityLink.findMany({ where: { isDeleted: false, sourceType: 'Requirement', targetType: 'Requirement', ...(projectId ? { projectId } : {}) } });
  let linkLines = '';
  for (const l of links) {
    linkLines += JSON.stringify({ index: { _index: IDX.link, _id: l.id } }) + '\n'
      + JSON.stringify({ sourceType: l.sourceType, sourceId: l.sourceId, sourceGlobalId: gidById.get(l.sourceId) || null, targetType: l.targetType, targetId: l.targetId, targetGlobalId: gidById.get(l.targetId) || null, relationType: l.linkType, note: l.coverageType || null }) + '\n';
  }
  await bulk(linkLines);
  await esReq('POST', `/${IDX.req},${IDX.chunk},${IDX.link}/_refresh`);
  return { requirements: reqs.length, chunks: chunkCount, links: links.length };
}

// Hybrid-ready search. BM25 across requirements + chunks; kNN added when embeddings exist.
export async function search(query: string, filters: any = {}, limit = 20): Promise<any[]> {
  const filterClauses: any[] = [];
  if (filters.projectId) filterClauses.push({ term: { projectId: filters.projectId } });
  if (filters.status) filterClauses.push({ term: { status: filters.status } });
  if (filters.priority) filterClauses.push({ term: { priority: filters.priority } });
  if (filters.type) filterClauses.push({ term: { type: filters.type } });
  const body: any = {
    size: limit,
    query: { bool: {
      must: query ? [{ multi_match: { query, fields: ['title^3', 'summary^2', 'acceptanceCriteria', 'implementationBackend', 'implementationFrontend', 'fullText'], type: 'best_fields', fuzziness: 'AUTO' } }] : [{ match_all: {} }],
      filter: filterClauses,
    } },
    highlight: { fields: { fullText: {}, acceptanceCriteria: {} }, fragment_size: 160, number_of_fragments: 2 },
  };
  const r = await esReq('POST', `/${IDX.req}/_search`, body);
  const hits = r.json?.hits?.hits || [];
  return hits.map((h: any) => ({
    id: h._id, score: h._score, globalId: h._source?.globalId, title: h._source?.title,
    status: h._source?.status, priority: h._source?.priority, module: h._source?.module,
    sourceUrl: h._source?.sourceUrl, snippet: (h.highlight?.fullText || h.highlight?.acceptanceCriteria || [h._source?.summary || ''])[0],
  }));
}

// Context pack: top relevant requirement chunks under a token budget (~4 chars/token heuristic).
export async function contextPack(task: string, tokenBudget = 16000): Promise<any> {
  const body = {
    size: 60,
    query: { multi_match: { query: task, fields: ['chunkText^2', 'title'], fuzziness: 'AUTO' } },
  };
  const r = await esReq('POST', `/${IDX.chunk}/_search`, body);
  const hits = r.json?.hits?.hits || [];
  const charBudget = tokenBudget * 4; let used = 0; const items: any[] = []; const seen = new Set<string>();
  for (const h of hits) {
    const txt = h._source?.chunkText || ''; if (!txt || seen.has(h._source?.sourceId + ':' + txt.slice(0, 40))) continue;
    if (used + txt.length > charBudget) break;
    used += txt.length; seen.add(h._source?.sourceId + ':' + txt.slice(0, 40));
    items.push({ globalId: h._source?.globalId, title: h._source?.title, sourceUrl: h._source?.sourceUrl, text: txt, score: h._score });
  }
  return { task, tokenBudgetChars: charBudget, usedChars: used, count: items.length, items };
}

// optional: index documentation markdown files into chunks
export async function indexDocs(rootDir: string): Promise<{ files: number; chunks: number }> {
  if (!fs.existsSync(rootDir)) return { files: 0, chunks: 0 };
  const mdFiles: string[] = [];
  const walk = (d: string, depth = 0) => { if (depth > 8) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/node_modules|\.git/.test(e.name)) walk(p, depth + 1); } else if (e.name.endsWith('.md')) mdFiles.push(p); } };
  walk(rootDir);
  let lines = ''; let chunkCount = 0;
  for (const f of mdFiles.slice(0, 5000)) {
    let text = ''; try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const rel = f.replace(rootDir, '').replace(/\\/g, '/');
    const title = (text.match(/^#\s+(.+)$/m) || [])[1] || path.basename(f);
    const chunks = chunkText(text);
    for (let ci = 0; ci < chunks.length; ci++) {
      lines += JSON.stringify({ index: { _index: IDX.chunk, _id: `doc:${rel}:${ci}` } }) + '\n'
        + JSON.stringify({ sourceType: 'Document', sourceId: rel, globalId: null, title, headingPath: rel, chunkText: chunks[ci], module: null, sourceUrl: rel }) + '\n';
      chunkCount++;
      if (lines.length > 800000) { await bulk(lines); lines = ''; }
    }
  }
  await bulk(lines); await esReq('POST', `/${IDX.chunk}/_refresh`);
  return { files: mdFiles.length, chunks: chunkCount };
}

export function registerElasticApi(app: FastifyInstance) {
  app.get('/api/search/status', async (req: any, reply) => { const u = await requireAuth(req, reply); if (!u) return; const ready = await esReady(); return reply.send({ ready, esUrl: ES_URL, embedder: !!EMBED_URL }); });
  app.post('/api/search/reindex', async (req: any, reply) => {
    const u = await requireAuth(req, reply); if (!u) return;
    if (!(await esReady())) return reply.code(503).send({ error: 'elasticsearch not reachable' });
    await ensureIndices();
    const b: any = req.body || {};
    const r = await indexRequirements(b.projectId);
    let docs = { files: 0, chunks: 0 };
    if (b.docsDir) docs = await indexDocs(b.docsDir);
    return reply.send({ ok: true, ...r, docs });
  });
  app.post('/api/search', async (req: any, reply) => {
    const u = await requireAuth(req, reply); if (!u) return;
    if (!(await esReady())) return reply.code(503).send({ error: 'elasticsearch not reachable' });
    const b: any = req.body || {};
    const items = await search(b.query || '', b.filters || {}, Math.min(b.limit || 20, 100));
    return reply.send({ items });
  });
  app.post('/api/context-pack', async (req: any, reply) => {
    const u = await requireAuth(req, reply); if (!u) return;
    if (!(await esReady())) return reply.code(503).send({ error: 'elasticsearch not reachable' });
    const b: any = req.body || {};
    return reply.send(await contextPack(b.task || b.query || '', b.tokenBudget || 16000));
  });
}
