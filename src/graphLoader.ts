import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { prisma } from './db.js';

/**
 * Loads the documentation knowledge graph (workspaces/documentation/product/tools/graph.json)
 * into the KnowledgeEntity / KnowledgeRelation tables so the second brain and the /graph
 * visualization run on the REAL project graph (308 docs, features, screens, modals,
 * cross-module edges) instead of a hardcoded stub.
 *
 * Idempotent and self-deploying: runs on every startup but skips work when the graph
 * content hash is unchanged. Only touches graph-sourced rows (metadata.source = 'graph');
 * manually-created entities/relations are preserved.
 */

const GRAPH_PATH = path.resolve(process.cwd(), 'workspaces/documentation/product/tools/graph.json');

// graph.json node-group -> KnowledgeEntity.type, and the edge-id prefix used in graph.json
const GROUP_TYPE: Record<string, string> = {
  doc: 'document',
  module: 'module',
  area: 'area',
  code_file: 'code_file',
  requirement: 'requirement',
  confluence: 'confluence',
  feature: 'feature',
  screen: 'screen', // overridden to 'modal' per-node when kind === 'modal'
  api: 'api',
};
const GROUP_PREFIX: Record<string, string> = {
  doc: 'doc',
  module: 'module',
  area: 'area',
  code_file: 'code',
  requirement: 'req',
  confluence: 'confluence',
  feature: 'feature',
  screen: 'screen',
  api: 'api',
};

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

type EntitySpec = { key: string; type: string; name: string; summary: string; metadata: any };

function buildEntities(nodes: any): EntitySpec[] {
  const out: EntitySpec[] = [];
  for (const [group, byId] of Object.entries(nodes as Record<string, Record<string, any>>)) {
    const prefix = GROUP_PREFIX[group];
    if (!prefix) continue;
    for (const [id, node] of Object.entries(byId)) {
      if (!id || /^TODO/i.test(id)) continue; // skip un-backfilled code_ref placeholders
      let type = GROUP_TYPE[group];
      let name = id;
      let summary = '';
      const metadata: any = { source: 'graph', group };
      if (group === 'doc') {
        summary = [node.domain, node.status].filter(Boolean).join(' · ');
        Object.assign(metadata, { domain: node.domain, status: node.status, confluence: node.confluence, repo: node.repo, codeRefs: node.code_refs, docType: node.type });
      } else if (group === 'feature') {
        name = node.name || id;
        summary = 'Фича / сущность';
      } else if (group === 'screen') {
        type = node.kind === 'modal' ? 'modal' : 'screen';
        name = node.label || node.route || id;
        summary = node.route ? `Экран: ${node.route}` : (node.kind === 'modal' ? 'Модальное окно' : 'Экран');
        Object.assign(metadata, { route: node.route, kind: node.kind });
      } else if (group === 'confluence') {
        summary = 'Страница Confluence';
        metadata.url = `https://shiptify.atlassian.net/wiki/spaces/TD/pages/${id}`;
      } else if (group === 'requirement') {
        summary = node.desc ? String(node.desc) : 'Требование (RTM)';
        if (node.confluence) { metadata.confluence = node.confluence; metadata.url = `https://shiptify.atlassian.net/wiki/spaces/TD/pages/${node.confluence}`; }
      } else if (group === 'module') {
        summary = 'Модуль / домен';
      } else if (group === 'area') {
        summary = 'Под-область';
        if (node.domain) metadata.domain = node.domain;
      } else if (group === 'code_file') {
        summary = 'Файл кода';
      } else if (group === 'api') {
        name = node.id || id;
        summary = [node.summary, node.resource ? `ресурс: ${node.resource}` : ''].filter(Boolean).join(' · ') || 'Эндпоинт публичного API';
        Object.assign(metadata, { method: node.method, path: node.path, resource: node.resource });
      }
      out.push({ key: `${prefix}:${id}`, type, name: name.slice(0, 200), summary: summary.slice(0, 2000), metadata });
    }
  }
  return out;
}

export async function loadGraphIntoDb(log: (m: string) => void = () => {}): Promise<{ loaded: boolean; missing: boolean; entities: number; relations: number }> {
  if (!existsSync(GRAPH_PATH)) {
    log(`graph.json not found at ${GRAPH_PATH} — skipping graph load`);
    return { loaded: false, missing: true, entities: 0, relations: 0 };
  }
  const raw = readFileSync(GRAPH_PATH, 'utf8');
  const hash = createHash('sha1').update(raw).digest('hex');

  // version guard: skip if this exact graph is already loaded
  try {
    const marker = await prisma.knowledgeEntity.findUnique({ where: { type_name: { type: '_meta', name: 'graph-version' } } });
    if (marker && (marker.metadata as any)?.hash === hash) {
      log('knowledge graph already current — skipping load');
      return { loaded: false, missing: false, entities: 0, relations: 0 };
    }
  } catch {
    // table may not exist yet on first boot before migration; caller handles errors
  }

  const graph = JSON.parse(raw);
  const specs = buildEntities(graph.nodes || {});

  // 1) upsert entities (batched) and resolve graph-key -> db id
  const keyToId = new Map<string, string>();
  for (const batch of chunk(specs, 40)) {
    await Promise.all(batch.map(async (s) => {
      const row = await prisma.knowledgeEntity.upsert({
        where: { type_name: { type: s.type, name: s.name } },
        update: { summary: s.summary, metadata: s.metadata },
        create: { type: s.type, name: s.name, summary: s.summary, metadata: s.metadata },
      });
      keyToId.set(s.key, row.id);
    }));
  }

  // 2) relations from edges [from, type, to] — dedupe, resolve, upsert (batched)
  const rawEdges: any[] = Array.isArray(graph.edges) ? graph.edges : [];
  const seen = new Set<string>();
  const rels: Array<{ fromId: string; toId: string; type: string }> = [];
  for (const e of rawEdges) {
    const from = keyToId.get(e[0]);
    const to = keyToId.get(e[2]);
    const type = e[1];
    if (!from || !to || !type) continue;
    const k = `${from}|${to}|${type}`;
    if (seen.has(k)) continue;
    seen.add(k);
    rels.push({ fromId: from, toId: to, type });
  }
  for (const batch of chunk(rels, 40)) {
    await Promise.all(batch.map((r) =>
      prisma.knowledgeRelation.upsert({
        where: { fromId_toId_type: { fromId: r.fromId, toId: r.toId, type: r.type } },
        update: {},
        create: r,
      }).catch(() => {})));
  }

  // 3) record version marker
  await prisma.knowledgeEntity.upsert({
    where: { type_name: { type: '_meta', name: 'graph-version' } },
    update: { summary: `loaded ${specs.length} nodes / ${rels.length} edges`, metadata: { hash, stats: graph.stats } },
    create: { type: '_meta', name: 'graph-version', summary: `loaded ${specs.length} nodes / ${rels.length} edges`, metadata: { hash, stats: graph.stats } },
  });

  log(`knowledge graph loaded: ${specs.length} entities, ${rels.length} relations`);
  return { loaded: true, missing: false, entities: specs.length, relations: rels.length };
}
