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

// Веса Coverage Score из ТЗ (сумма = 100%).
const W = { subreq: 20, docs: 15, tests: 25, automation: 20, execution: 10, defects: 10 } as const;

// Компоненты покрытия (0..100 или null = «нет источника данных»).
type Comp = { subreq: number | null; docs: number | null; tests: number | null; automation: number | null; execution: number | null; defects: number | null; bugs: number | null };

const LAYER_KEYS = ['subreq', 'docs', 'tests', 'automation', 'execution', 'defects'] as const;
type LayerKey = typeof LAYER_KEYS[number];

// Динамический Coverage Score: 100% считается ТОЛЬКО по ВКЛЮЧЁННЫМ слоям (renormalize).
// Включённый слой без данных = 0% (честно штрафует: «включил Tests, а тестов нет»).
// Выключенный слой не учитывается вовсе — так пользователь отключает параметры «с конца».
function coverageScore(c: Comp, enabled: string[]): number {
  const m: Record<string, number | null> = { subreq: c.subreq, docs: c.docs, tests: c.tests, automation: c.automation, execution: c.execution, defects: c.defects };
  let num = 0, den = 0;
  for (const k of LAYER_KEYS) { if (!enabled.includes(k)) continue; num += (m[k] ?? 0) * W[k]; den += W[k]; }
  return den ? Math.round(num / den) : 0;
}

async function loadGraph() {
  const [ents, rels] = await Promise.all([
    prisma.knowledgeEntity.findMany({ where: { type: { notIn: ['_meta'] } } }) as any as Promise<Ent[]>,
    prisma.knowledgeRelation.findMany() as any as Promise<Rel[]>,
  ]);
  return { ents, rels };
}

function compute(ents: Ent[], rels: Rel[], enabled: string[]) {
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

  // Доступность слоёв = есть ли подключённый источник данных в графе.
  const has = (t: string) => ents.some((e) => e.type === t);
  const layersAvailable: Record<string, boolean> = {
    subreq: reqs.length > 0 || docs.length > 0,
    docs: docs.length > 0,
    tests: has('test_case'),
    automation: has('automation'),
    execution: has('execution'),
    defects: has('defect'),
  };

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

  // Компоненты покрытия (0..100 / null) для модуля или области.
  function components(docList: Ent[], reqIds: string[]): Comp {
    const { docScore } = scoreDocs(docList);
    const coveredReq = reqIds.filter((rid) => (reqCoverDocs[rid] || []).some((did) => statusScore(byId[did]?.metadata?.status) >= 0.5)).length;
    const subreq = reqIds.length ? pct(coveredReq, reqIds.length) : (docList.length ? 100 : 0);
    return {
      subreq: layersAvailable.subreq ? subreq : null,
      docs: docList.length ? docScore : null,
      tests: layersAvailable.tests ? 0 : null,
      automation: layersAvailable.automation ? 0 : null,
      execution: layersAvailable.execution ? 0 : null,
      defects: layersAvailable.defects ? 100 : null,
      bugs: layersAvailable.defects ? 0 : null,
    };
  }

  function moduleEntry(name: string, m: { docs: Ent[]; reqs: string[]; areas: Record<string, Ent[]> }) {
    const { docScore, breakdown } = scoreDocs(m.docs);
    const reqIds = m.reqs;
    const coveredReq = reqIds.filter((rid) => (reqCoverDocs[rid] || []).some((did) => statusScore(byId[did]?.metadata?.status) >= 0.5)).length;
    const comp = components(m.docs, reqIds);
    const score = coverageScore(comp, enabled);
    const riskCount = m.docs.filter((d) => ['not-implemented', 'icebox', 'partial'].includes(d.metadata?.status)).length;
    const size = Math.max(reqIds.length, m.docs.length, 1);

    const areas = Object.entries(m.areas).map(([aid, list]) => {
      const c = components(list, []);
      return { id: aid, name: aid, size: list.length, score: coverageScore(c, enabled), docCount: list.length, comp: c };
    }).sort((a, b) => b.size - a.size);

    return {
      name, size, coverageScore: score, comp,
      docScore, reqScore: comp.subreq ?? 0, riskScore: 100 - score,
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
    testCoverage: layersAvailable.tests ? wAvg((m) => m.comp.tests ?? 0) : null,
    automationCoverage: layersAvailable.automation ? wAvg((m) => m.comp.automation ?? 0) : null,
    riskScore: wAvg((m) => m.riskScore),
    modulesCount: modules.length,
    requirementsTotal: reqs.length,
    docsTotal: docs.length,
    topRiskModules: [...modules].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5).map((m) => ({ name: m.name, score: m.coverageScore, risk: m.riskScore })),
    topUncovered: [...modules].sort((a, b) => a.coverageScore - b.coverageScore).slice(0, 5).map((m) => ({ name: m.name, score: m.coverageScore })),
    layersAvailable,
    enabled,
    weights: W,
  };

  return { kpi, modules };
}

// Матрица трассируемости: требование × {SubReq, Docs, Tests, Auto, Run, Bugs, Score}
function buildMatrix(ents: Ent[], rels: Rel[], enabled: string[], moduleFilter?: string) {
  const byId: Record<string, Ent> = Object.fromEntries(ents.map((e) => [e.id, e]));
  const reqs = ents.filter((e) => e.type === 'requirement');
  const reqCoverDocs: Record<string, string[]> = {};
  for (const r of rels) if (r.type === 'covered_by') (reqCoverDocs[r.fromId] = reqCoverDocs[r.fromId] || []).push(r.toId);
  const docDomain = (d?: Ent) => (d?.metadata?.domain && d.metadata.domain !== '?' ? d.metadata.domain : 'Прочее');
  const has = (t: string) => ents.some((e) => e.type === t);
  const av = { tests: has('test_case'), automation: has('automation'), execution: has('execution'), defects: has('defect') };

  const rows = reqs.map((req) => {
    const dlist = (reqCoverDocs[req.id] || []).map((id) => byId[id]).filter(Boolean);
    const domain = dlist.length ? docDomain(dlist[0]) : 'Прочее';
    const hasDoc = dlist.length > 0;
    const docsPct = hasDoc ? Math.round(Math.max(...dlist.map((d) => statusScore(d.metadata?.status))) * 100) : 0;
    const comp: Comp = {
      subreq: hasDoc ? 100 : 0,
      docs: docsPct,
      tests: av.tests ? 0 : null,
      automation: av.automation ? 0 : null,
      execution: av.execution ? 0 : null,
      defects: av.defects ? 100 : null,
      bugs: av.defects ? 0 : null,
    };
    const score = coverageScore(comp, enabled);
    const risk = score < 60 ? 'High' : score < 80 ? 'Medium' : 'Low';
    return {
      requirement: req.name, summary: req.metadata?.summary || '', module: domain,
      subreq: comp.subreq, docs: comp.docs, tests: comp.tests, automation: comp.automation,
      execution: comp.execution, bugs: comp.bugs, score, risk,
      confluence: req.metadata?.confluence || null,
    };
  }).sort((a, b) => a.score - b.score);
  return moduleFilter ? rows.filter((r) => r.module === moduleFilter) : rows;
}

export async function registerQualityApi(app: FastifyInstance) {
  // Полный отчёт: KPI + treemap(модули/области) + матрица.
  // Включённые слои: ?layers=subreq,docs,tests,automation,execution,defects (по умолч. все).
  const getLayers = (req: any): string[] => {
    const raw = String(req.query?.layers || '').split(',').map((s) => s.trim()).filter(Boolean);
    const valid = raw.filter((k) => (LAYER_KEYS as readonly string[]).includes(k));
    return valid.length ? valid : [...LAYER_KEYS];
  };

  app.get('/api/quality', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const { ents, rels } = await loadGraph();
    const { kpi, modules } = compute(ents, rels, getLayers(req));
    return reply.send({ kpi, modules });
  });

  // Матрица трассируемости (опц. фильтр по модулю).
  app.get('/api/quality/matrix', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const { ents, rels } = await loadGraph();
    const rows = buildMatrix(ents, rels, getLayers(req), req.query?.module ? String(req.query.module) : undefined);
    return reply.send({ rows: rows.slice(0, 1500), total: rows.length });
  });

  // Снапшоты: сохранить текущее состояние / список / сравнение двух.
  app.post('/api/quality/snapshots', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply); if (!admin) return;
    const { ents, rels } = await loadGraph();
    const { kpi, modules } = compute(ents, rels, [...LAYER_KEYS]);
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
