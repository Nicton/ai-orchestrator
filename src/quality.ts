import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './db.js';
import { requireAuth, requireAdmin } from './auth.js';

// ── Источник тестов (Layer 1): экспорт Qase docs/qa/*.json ──────────────────
// Кейсы не имеют тегов/REQ-ID, поэтому маппим по именам сьютов на домен.
const QA_RULES: Array<[RegExp, string]> = [
  [/slot|slotbook|dock|gate|visit|\bzone|planning|tv\s*display|load view/i, 'DOCK'],
  [/heppner|dhl|fedex|\bups\b|inttra|edifact|\bedi\b|\bsap\b|\bp44\b|shippeo|aftership|teliae|teliway|calvacom|dachser|kuehne|schenker|integration|webhook|emailing|brinks/i, 'Integrations'],
  [/role|team|spectator|booker|invite|permission/i, 'Admin-App'],
  [/\bchat\b|message|discussion|notification/i, 'Chat'],
  [/mini[-\s]?app|driver app|carrier portal|quick shipment/i, 'Mini-Apps'],
];
function suiteToDomain(suitePath: string[]): string {
  const s = suitePath.join(' / ');
  for (const [re, dom] of QA_RULES) if (re.test(s)) return dom;
  return 'TMS'; // основное приложение
}
const QA_STOP = new Set(('the a an of to in on for and or is are with без для при как что это нет под над или там где это req требование requirement открыть нажать проверить выбрать создать test tests check verify should когда если иначе страница page button кнопка поле field пользователь user able can does окно вкладка список view экран a-b shipper carrier admin').split(/\s+/));
function tokens(s: string): string[] {
  return [...new Set((String(s || '').toLowerCase().match(/[a-zа-яё0-9]{4,}/gi) || []).filter((w) => !QA_STOP.has(w)))];
}
type QaCase = { tk: Set<string>; auto: boolean };
let _qaCache: any = null;
function loadQa(): { available: boolean; byDomain: Record<string, { total: number; automated: number }>; casesByDomain: Record<string, QaCase[]> } {
  if (_qaCache) return _qaCache;
  const p = path.resolve(process.cwd(), 'docs/qa/test-cases-MA-2026-05-25.json');
  try {
    const d = JSON.parse(readFileSync(p, 'utf8'));
    const byDomain: Record<string, { total: number; automated: number }> = {};
    const casesByDomain: Record<string, QaCase[]> = {};
    (function walk(arr: any[], pathArr: string[]) {
      for (const x of arr || []) {
        const pp = pathArr.concat(x.title || x.name || '?');
        for (const c of (x.cases || [])) {
          if (c.status === 'deprecated') continue;
          const dom = suiteToDomain(pp);
          (byDomain[dom] = byDomain[dom] || { total: 0, automated: 0 }).total++;
          const auto = c.automation === 'automated';
          if (auto) byDomain[dom].automated++;
          const tk = new Set(tokens(pp.join(' ') + ' ' + (c.title || '') + ' ' + (c.description || '')));
          (casesByDomain[dom] = casesByDomain[dom] || []).push({ tk, auto });
        }
        if (x.suites) walk(x.suites, pp);
      }
    })(d.suites || [], []);
    _qaCache = { available: Object.keys(byDomain).length > 0, byDomain, casesByDomain };
  } catch {
    _qaCache = { available: false, byDomain: {}, casesByDomain: {} };
  }
  return _qaCache;
}

// Сколько тест-кейсов (в том же домене) текстово матчат требование (≥2 общих токена).
function reqTestMatch(reqText: string, domain: string, qa: ReturnType<typeof loadQa>): { matched: number; automated: number } {
  const rt = tokens(reqText);
  if (rt.length < 1) return { matched: 0, automated: 0 };
  const list = qa.casesByDomain[domain] || [];
  let matched = 0, automated = 0;
  for (const c of list) {
    let n = 0;
    for (const t of rt) { if (c.tk.has(t)) { n++; if (n >= 2) break; } }
    if (n >= 2) { matched++; if (c.auto) automated++; }
  }
  return { matched, automated };
}

// ── Автотесты репозитория (TestCafe) как слой Automation ────────────────────
let _autoCache: any = null;
function loadAuto(): { available: boolean; items: { tk: Set<string> }[] } {
  if (_autoCache) return _autoCache;
  const p = path.resolve(process.cwd(), 'docs/qa/autotests-index.json');
  try {
    const d = JSON.parse(readFileSync(p, 'utf8'));
    const items = (d.items || []).map((it: any) => ({ tk: new Set<string>(it.tk || []) }));
    _autoCache = { available: items.length > 0, items };
  } catch { _autoCache = { available: false, items: [] }; }
  return _autoCache;
}
// Матчинг требования с автотестами по токенам (без привязки к домену — публичные API
// тесты покрывают разные модули). Возвращает число матчащих автотестов.
function reqAutoMatch(reqText: string): number {
  const rt = tokens(reqText);
  if (rt.length < 1) return 0;
  const auto = loadAuto();
  let m = 0;
  for (const it of auto.items) {
    let n = 0;
    for (const t of rt) { if (it.tk.has(t)) { n++; if (n >= 2) break; } }
    if (n >= 2) m++;
  }
  return m;
}

// ── Открытые дефекты Jira как слой Defects ("отсутствие дефектов") ───────────
let _defCache: any = null;
function loadDefects(): { available: boolean; total: number; byDomain: Record<string, { open: number; weight: number; high: number }>; items: { d: string; w: number; tk: Set<string> }[] } {
  if (_defCache) return _defCache;
  const p = path.resolve(process.cwd(), 'docs/qa/defects-index.json');
  try {
    const d = JSON.parse(readFileSync(p, 'utf8'));
    const items = (d.items || []).map((it: any) => ({ d: it.d, w: it.w, tk: new Set<string>(it.tk || []) }));
    _defCache = { available: items.length > 0, total: items.length, byDomain: d.byDomain || {}, items };
  } catch { _defCache = { available: false, total: 0, byDomain: {}, items: [] }; }
  return _defCache;
}
// Сколько открытых дефектов (того же домена) текстово матчат требование (≥2 токена) + сумма весов (severity).
function reqDefectMatch(reqText: string, domain: string): { matched: number; weight: number } {
  const rt = tokens(reqText);
  if (rt.length < 1) return { matched: 0, weight: 0 };
  const def = loadDefects();
  let matched = 0, weight = 0;
  // ≥3 общих токена (строже, чем для тестов) — чтобы общие слова не давали ложные совпадения.
  for (const it of def.items) {
    if (it.d !== domain) continue;
    let n = 0;
    for (const t of rt) { if (it.tk.has(t)) { n++; if (n >= 3) break; } }
    if (n >= 3) { matched++; weight += it.w; }
  }
  return { matched, weight };
}

// Quality Coverage Engine — единый движок расчёта покрытия поверх графа знаний
// (Data Lake = KnowledgeEntity/Relation). Источник один, представлений несколько.

type Ent = { id: string; name: string; type: string; metadata: any; summary?: string | null };
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
  // Слой «Спецификации»: спека — документ с метаданными type: spec (специфицирует требование
  // через acceptance-критерии). Балл слоя считается по покрытию требований именно спеками.
  const isSpec = (d?: Ent) => d?.metadata?.docType === 'spec';

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

  const qa = loadQa();

  const auto = loadAuto();
  const def = loadDefects();
  // Доступность слоёв = есть ли подключённый источник данных.
  const layersAvailable: Record<string, boolean> = {
    subreq: reqs.length > 0 || docs.length > 0,
    docs: docs.some(isSpec), // слой доступен, если есть хотя бы одна спека (type: spec)
    tests: qa.available,
    automation: auto.available,
    execution: false,
    defects: def.available,
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

  // Tests / Automation / Defects по требованиям домена (текстовый матчинг).
  function reqLayers(reqIds: string[], domain: string): { tests: number | null; automation: number | null; defects: number | null; bugs: number | null } {
    const tOn = qa.available, aOn = auto.available, dOn = def.available;
    if (!reqIds.length) {
      const open = def.byDomain[domain]?.open || 0; // нет требований — сигнал на уровне домена
      return {
        tests: tOn ? 0 : null, automation: aOn ? 0 : null,
        defects: dOn ? (open > 0 ? Math.max(10, 100 - Math.min(90, open * 4)) : 100) : null,
        bugs: dOn ? open : null,
      };
    }
    let matchedT = 0, matchedA = 0, reqsWithDef = 0, bugs = 0;
    for (const rid of reqIds) {
      const txt = (byId[rid]?.name || '') + ' ' + (byId[rid]?.summary || '');
      if (tOn && reqTestMatch(txt, domain, qa).matched > 0) matchedT++;
      if (aOn && reqAutoMatch(txt) > 0) matchedA++;
      if (dOn) { const dm = reqDefectMatch(txt, domain); if (dm.matched > 0) { reqsWithDef++; bugs += dm.matched; } }
    }
    // «отсутствие дефектов»: соотношение багов к числу требований (плотность),
    // мягкий порог — нужно в среднем DEFECT_DENOM открытых бага на требование, чтобы дойти до 0%.
    const DEFECT_DENOM = 3;
    const density = bugs / reqIds.length; // багов на требование
    return {
      tests: tOn ? Math.round((matchedT / reqIds.length) * 100) : null,
      automation: aOn ? Math.round((matchedA / reqIds.length) * 100) : null,
      defects: dOn ? Math.max(0, Math.round(100 - Math.min(100, (density / DEFECT_DENOM) * 100))) : null,
      bugs: dOn ? bugs : null,
    };
  }

  // Компоненты покрытия (0..100 / null) для модуля.
  function components(docList: Ent[], reqIds: string[], domain: string): Comp {
    const coveredReq = reqIds.filter((rid) => (reqCoverDocs[rid] || []).some((did) => statusScore(byId[did]?.metadata?.status) >= 0.5)).length;
    const subreq = reqIds.length ? pct(coveredReq, reqIds.length) : (docList.length ? 100 : 0);
    // Слой «Спецификации»: доля требований, покрытых СПЕКОЙ (type: spec, статус ≥ 0.5).
    // Без требований — 100, если в наборе есть хотя бы одна спека.
    const specInList = docList.filter(isSpec);
    const specCovered = reqIds.filter((rid) => (reqCoverDocs[rid] || []).some((did) => isSpec(byId[did]) && statusScore(byId[did]?.metadata?.status) >= 0.5)).length;
    const specScore = reqIds.length ? pct(specCovered, reqIds.length) : (specInList.length ? 100 : 0);
    const tl = reqLayers(reqIds, domain);
    return {
      subreq: layersAvailable.subreq ? subreq : null,
      docs: layersAvailable.docs ? specScore : null,
      tests: tl.tests,
      automation: tl.automation,
      execution: layersAvailable.execution ? 0 : null,
      defects: tl.defects,
      bugs: tl.bugs,
    };
  }

  function moduleEntry(name: string, m: { docs: Ent[]; reqs: string[]; areas: Record<string, Ent[]> }) {
    const { docScore, breakdown } = scoreDocs(m.docs);
    const reqIds = m.reqs;
    const coveredReq = reqIds.filter((rid) => (reqCoverDocs[rid] || []).some((did) => statusScore(byId[did]?.metadata?.status) >= 0.5)).length;
    const comp = components(m.docs, reqIds, name);
    const score = coverageScore(comp, enabled);
    const riskCount = m.docs.filter((d) => ['not-implemented', 'icebox', 'partial'].includes(d.metadata?.status)).length;
    const size = Math.max(reqIds.length, m.docs.length, 1);

    // Области наследуют Tests/Auto модуля (нет req-level матчинга на уровне области).
    const areas = Object.entries(m.areas).map(([aid, list]) => {
      const c = components(list, [], name);
      c.tests = comp.tests; c.automation = comp.automation; c.defects = comp.defects; c.bugs = comp.bugs;
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
    specCoverage: layersAvailable.docs ? wAvg((m) => m.comp.docs ?? 0) : null,
    requirementCoverage: wAvg((m) => m.reqScore),
    testCoverage: layersAvailable.tests ? wAvg((m) => m.comp.tests ?? 0) : null,
    automationCoverage: layersAvailable.automation ? wAvg((m) => m.comp.automation ?? 0) : null,
    defectScore: layersAvailable.defects ? wAvg((m) => m.comp.defects ?? 100) : null,
    bugsTotal: layersAvailable.defects ? def.total ?? modules.reduce((a, m) => a + (m.comp.bugs || 0), 0) : null,
    riskScore: wAvg((m) => m.riskScore),
    modulesCount: modules.length,
    requirementsTotal: reqs.length,
    docsTotal: docs.length,
    specsTotal: docs.filter(isSpec).length,
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
  const isSpec = (d?: Ent) => d?.metadata?.docType === 'spec';
  const qa = loadQa();
  const def = loadDefects();

  const rows = reqs.map((req) => {
    const dlist = (reqCoverDocs[req.id] || []).map((id) => byId[id]).filter(Boolean);
    const domain = dlist.length ? docDomain(dlist[0]) : 'Прочее';
    const hasDoc = dlist.length > 0;
    // Колонка «Спека»: требование покрыто спекой (type: spec, статус ≥ 0.5)?
    const hasSpec = dlist.some((d) => isSpec(d) && statusScore(d.metadata?.status) >= 0.5);
    const docsPct = hasSpec ? 100 : 0;
    const reqText = (req.name || '') + ' ' + (req.summary || '');
    const tm = reqTestMatch(reqText, domain, qa);
    const am = reqAutoMatch(reqText);
    const dm = reqDefectMatch(reqText, domain);
    const comp: Comp = {
      subreq: hasDoc ? 100 : 0,
      docs: docsPct,
      tests: qa.available ? (tm.matched > 0 ? 100 : 0) : null,
      automation: loadAuto().available ? (am > 0 ? 100 : 0) : null,
      execution: null,
      defects: def.available ? (dm.matched > 0 ? Math.max(40, 100 - dm.matched * 20) : 100) : null,
      bugs: def.available ? dm.matched : null,
    };
    const score = coverageScore(comp, enabled);
    const risk = score < 60 ? 'High' : score < 80 ? 'Medium' : 'Low';
    return {
      requirement: req.name, summary: req.summary || req.metadata?.summary || '', module: domain,
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
