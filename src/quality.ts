import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './db.js';
import { requireAuth, requireAdmin } from './auth.js';

// Quality Coverage Engine — единый движок расчёта покрытия поверх графа знаний
// (Data Lake = KnowledgeEntity/Relation). Источник один, представлений несколько.

type Ent = { id: string; name: string; type: string; metadata: any };
type Rel = { fromId: string; toId: string; type: string };

function statusScore(s?: string | null): number {
  if (s === 'implemented') return 1;
  if (s === 'partial') return 0.5;
  if (s === 'not-implemented' || s === 'icebox') return 0;
  return 0.7; // неизвестно
}
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

// Слои покрытия. Доступность определяется наличием данных в графе (динамический счёт:
// недоступные слои НЕ штрафуют — 100% считается от доступных).
const LAYERS = ['requirements', 'documentation', 'tests', 'automation', 'execution'] as const;

async function loadGraph() {
  const [ents, rels] = await Promise.all([
    prisma.knowledgeEntity.findMany({ where: { type: { notIn: ['_meta'] } } }) as any as Promise<Ent[]>,
    prisma.knowledgeRelation.findMany() as any as Promise<Rel[]>,
  ]);
  return { ents, rels };
}

function compute(ents: Ent[], rels: Rel[], depth: string[]) {
  const byId: Record<string, Ent> = Object.fromEntries(ents.map((e) => [e.id, e]));
  const docs = ents.filter((e) => e.type === 'document');
  const reqs = ents.filter((e) => e.type === 'requirement');

  // covered_by: req -> [docId]
  const reqCoverDocs: Record<string, string[]> = {};
  for (const r of rels) if (r.type === 'covered_by') (reqCoverDocs[r.fromId] = reqCoverDocs[r.fromId] || []).push(r.toId);

  const docDomain = (d: Ent) => (d.metadata?.domain && d.metadata.domain !== '?' ? d.metadata.domain : 'Прочее');
  const docArea = (d: Ent) => { const id = d.id; const p = id.split('.'); return p.length >= 3 ? p.slice(0, -1).join('.') : null; };

  // requirement -> domain (по покрывающим докам)
  const reqDomain: Record<string, string> = {};
  for (const req of reqs) {
    const dlist = (reqCoverDocs[req.id] || []).map((id) => byId[id]).filter(Boolean);
    reqDomain[req.id] = dlist.length ? docDomain(dlist[0]) : 'Прочее';
  }

  // Какие слои реально есть данные?
  const layersAvailable: Record<string, boolean> = {
    requirements: reqs.length > 0,
    documentation: docs.length > 0,
    tests: ents.some((e) => e.type === 'test_case'),       // источник не подключён → false
    automation: ents.some((e) => e.type === 'automation'), // источник не подключён → false
    execution: ents.some((e) => e.type === 'execution'),
  };
  const activeDepth = depth.filter((l) => layersAvailable[l]);

  // Группировка по модулю → области
  const modMap: Record<string, { docs: Ent[]; reqs: string[]; areas: Record<string, Ent[]> }> = {};
  for (const d of docs) {
    const m = docDomain(d);
    (modMap[m] = modMap[m] || { docs: [], reqs: [], areas: {} });
    modMap[m].docs.push(d);
    const a = docArea(d);
    if (a) (modMap[m].areas[a] = modMap[m].areas[a] || []).push(d);
  }
  for (const req of reqs) { const m = reqDomain[req.id]; (modMap[m] = modMap[m] || { docs: [], reqs: [], areas: {} }); modMap[m].reqs.push(req.id); }

  // счётчики фич/экранов/модалок по модулю (через has_feature/screen/modal от модуля)
  const modFeat: Record<string, Set<string>> = {}, modScr: Record<string, Set<string>> = {};
  for (const r of rels) {
    if (r.fromId.startsWith('') && byId[r.fromId]?.type === 'module') {
      const mod = byId[r.fromId].name;
      if (r.type === 'feature') (modFeat[mod] = modFeat[mod] || new Set()).add(r.toId);
      if (r.type === 'screen' || r.type === 'modal') (modScr[mod] = modScr[mod] || new Set()).add(r.toId);
    }
  }

  function scoreDocs(list: Ent[]) {
    if (!list.length) return { docScore: 0, breakdown: { implemented: 0, partial: 0, 'not-implemented': 0, icebox: 0, unknown: 0 } };
    const bd: any = { implemented: 0, partial: 0, 'not-implemented': 0, icebox: 0, unknown: 0 };
    let sum = 0;
    for (const d of list) { const s = d.metadata?.status || 'unknown'; bd[s in bd ? s : 'unknown']++; sum += statusScore(d.metadata?.status); }
    return { docScore: Math.round((sum / list.length) * 100), breakdown: bd };
  }

  function moduleEntry(name: string, m: { docs: Ent[]; reqs: string[]; areas: Record<string, Ent[]> }) {
    const { docScore, breakdown } = scoreDocs(m.docs);
    // requirement coverage: требование покрыто, если есть покрывающий док со статусом implemented/partial
    const reqIds = m.reqs;
    const coveredReq = reqIds.filter((rid) => (reqCoverDocs[rid] || []).some((did) => statusScore(byId[did]?.metadata?.status) >= 0.5)).length;
    const reqScore = pct(coveredReq, reqIds.length);

    // динамический Coverage Score — среднее по активным слоям, для которых есть значение
    const layerScore: Record<string, number | null> = {
      requirements: reqIds.length ? reqScore : null,
      documentation: m.docs.length ? docScore : null,
      tests: null, automation: null, execution: null,
    };
    const vals = activeDepth.map((l) => layerScore[l]).filter((v): v is number => v != null);
    const coverageScore = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

    const riskCount = m.docs.filter((d) => ['not-implemented', 'icebox', 'partial'].includes(d.metadata?.status)).length;
    const riskScore = 100 - coverageScore;
    const size = Math.max(reqIds.length, m.docs.length, 1);

    const areas = Object.entries(m.areas).map(([aid, list]) => {
      const sd = scoreDocs(list);
      return { id: aid, name: aid, size: list.length, score: sd.docScore, docCount: list.length };
    }).sort((a, b) => b.size - a.size);

    return {
      name, size, coverageScore, docScore, reqScore, riskScore,
      docCount: m.docs.length, reqCount: reqIds.length, coveredReq,
      featureCount: (modFeat[name] || new Set()).size, screenCount: (modScr[name] || new Set()).size,
      riskCount, breakdown, areas,
    };
  }

  const modules = Object.entries(modMap).map(([name, m]) => moduleEntry(name, m)).filter((x) => x.size > 0).sort((a, b) => b.size - a.size);

  // KPI верхнего уровня (взвешенно по размеру)
  const totalSize = modules.reduce((a, m) => a + m.size, 0) || 1;
  const wAvg = (f: (m: any) => number) => Math.round(modules.reduce((a, m) => a + f(m) * m.size, 0) / totalSize);
  const kpi = {
    overallQuality: wAvg((m) => m.coverageScore),
    coverage: wAvg((m) => m.coverageScore),
    documentation: wAvg((m) => m.docScore),
    requirementCoverage: wAvg((m) => m.reqScore),
    testCoverage: layersAvailable.tests ? wAvg((m) => 0) : null,
    automationCoverage: layersAvailable.automation ? 0 : null,
    riskScore: wAvg((m) => m.riskScore),
    modulesCount: modules.length,
    requirementsTotal: reqs.length,
    docsTotal: docs.length,
    topRiskModules: [...modules].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5).map((m) => ({ name: m.name, score: m.coverageScore, risk: m.riskScore })),
    topUncovered: [...modules].sort((a, b) => a.coverageScore - b.coverageScore).slice(0, 5).map((m) => ({ name: m.name, score: m.coverageScore })),
    layersAvailable,
    activeDepth,
  };

  return { kpi, modules };
}

// Матрица трассируемости: требования × {Docs, Tests, Auto, Exec, Risk}
function buildMatrix(ents: Ent[], rels: Rel[], moduleFilter?: string) {
  const byId: Record<string, Ent> = Object.fromEntries(ents.map((e) => [e.id, e]));
  const reqs = ents.filter((e) => e.type === 'requirement');
  const reqCoverDocs: Record<string, string[]> = {};
  for (const r of rels) if (r.type === 'covered_by') (reqCoverDocs[r.fromId] = reqCoverDocs[r.fromId] || []).push(r.toId);
  const docDomain = (d?: Ent) => (d?.metadata?.domain && d.metadata.domain !== '?' ? d.metadata.domain : 'Прочее');

  const rows = reqs.map((req) => {
    const dlist = (reqCoverDocs[req.id] || []).map((id) => byId[id]).filter(Boolean);
    const domain = dlist.length ? docDomain(dlist[0]) : 'Прочее';
    const hasDoc = dlist.length > 0;
    const docImpl = dlist.some((d) => statusScore(d.metadata?.status) >= 0.5);
    const risk = !hasDoc ? 'High' : docImpl ? 'Low' : 'Medium';
    return {
      requirement: req.name,
      summary: req.metadata?.summary || (req as any).summary || '',
      module: domain,
      docs: hasDoc ? (docImpl ? 'ok' : 'partial') : 'none',
      tests: 'nodata', automation: 'nodata', execution: 'nodata',
      risk,
      confluence: req.metadata?.confluence || null,
    };
  });
  return moduleFilter ? rows.filter((r) => r.module === moduleFilter) : rows;
}

export async function registerQualityApi(app: FastifyInstance) {
  // Полный отчёт: KPI + treemap(модули/области) + матрица.
  app.get('/api/quality', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const depth = String(req.query?.depth || 'requirements,documentation').split(',').map((s) => s.trim()).filter(Boolean);
    const { ents, rels } = await loadGraph();
    const { kpi, modules } = compute(ents, rels, depth.length ? depth : ['requirements', 'documentation']);
    return reply.send({ kpi, modules, generatedAt: undefined });
  });

  // Матрица трассируемости (опц. фильтр по модулю).
  app.get('/api/quality/matrix', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const { ents, rels } = await loadGraph();
    const rows = buildMatrix(ents, rels, req.query?.module ? String(req.query.module) : undefined);
    return reply.send({ rows: rows.slice(0, 1500), total: rows.length });
  });

  // Снапшоты: сохранить текущее состояние / список / сравнение двух.
  app.post('/api/quality/snapshots', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply); if (!admin) return;
    const { ents, rels } = await loadGraph();
    const { kpi, modules } = compute(ents, rels, ['requirements', 'documentation']);
    const snap = await prisma.qualitySnapshot.create({
      data: { label: (req.body?.label || '').toString().slice(0, 120) || null, createdBy: admin.name, data: { kpi, modules: modules.map((m) => ({ name: m.name, size: m.size, coverageScore: m.coverageScore, riskScore: m.riskScore })) } as any },
    });
    return reply.code(201).send({ id: snap.id });
  });
  app.get('/api/quality/snapshots', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const list = await prisma.qualitySnapshot.findMany({ orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, label: true, createdAt: true, createdBy: true } });
    return reply.send({ snapshots: list });
  });
  app.get('/api/quality/compare', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const a = await prisma.qualitySnapshot.findUnique({ where: { id: String(req.query?.a || '') } });
    const b = await prisma.qualitySnapshot.findUnique({ where: { id: String(req.query?.b || '') } });
    if (!a || !b) return reply.code(404).send({ error: 'snapshot not found' });
    const ma = Object.fromEntries(((a.data as any).modules || []).map((m: any) => [m.name, m]));
    const mb = Object.fromEntries(((b.data as any).modules || []).map((m: any) => [m.name, m]));
    const names = [...new Set([...Object.keys(ma), ...Object.keys(mb)])];
    const diff = names.map((n) => ({ name: n, before: ma[n]?.coverageScore ?? null, after: mb[n]?.coverageScore ?? null, delta: (mb[n]?.coverageScore ?? 0) - (ma[n]?.coverageScore ?? 0) })).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
    return reply.send({ a: { id: a.id, kpi: (a.data as any).kpi }, b: { id: b.id, kpi: (b.data as any).kpi }, diff });
  });
}
