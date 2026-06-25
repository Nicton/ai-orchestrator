import type { FastifyInstance } from 'fastify';
import { prisma } from './db.js';
import { requireAuth } from './auth.js';

// ---------------------------------------------------------------------------
// QA PLATFORM (TMS + RMS + Automation Coverage + Traceability) — внутренний
// модуль Searchify. API-first: всё, что есть в UI, доступно через REST; основной
// потребитель — AI-агент (Claude Code) + QA Lead/Engineer. globalId, soft delete,
// версионирование (снэпшоты), bulk, traceability и расчёт покрытия. Полное ТЗ —
// QA_Platform_Final_Full_TZ. Реализовано на стеке Searchify (Fastify+Prisma+PG).
// ---------------------------------------------------------------------------

type U = { id: string; name?: string | null; email?: string | null };
function auth(u: U) { const by = u.name || u.email || u.id; return { createdBy: by, updatedBy: by }; }
function nowIso() { return new Date(); }

// Stable, human-readable, project-scoped global id (REQ-1, TC-12, AT-99, …).
async function nextGlobalId(projectId: string, prefix: string): Promise<string> {
  const c = await prisma.qaIdCounter.upsert({
    where: { projectId_prefix: { projectId, prefix } },
    create: { projectId, prefix, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `${prefix}-${c.lastNumber}`;
}

// Generic version snapshot (no diff viewer required, but full state stored).
async function snapshot(entityType: string, entity: any, by?: string | null, comment?: string, changeReason?: string) {
  try {
    await prisma.qaVersion.create({
      data: { projectId: entity.projectId, entityType, entityId: entity.id, versionNumber: entity.currentVersionNumber || 1, snapshotJson: entity as any, comment: comment || null, changeReason: changeReason || null, createdBy: by || null },
    });
  } catch { /* never break a write because versioning failed */ }
}

function listArgs(q: any) {
  const page = Math.max(1, parseInt(q?.page || '1', 10) || 1);
  const pageSize = Math.min(1000, Math.max(1, parseInt(q?.pageSize || '50', 10) || 50));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

async function runBulk<T>(items: T[], fn: (item: T, i: number) => Promise<any>) {
  const results: any[] = []; let succeeded = 0; let failed = 0;
  for (let i = 0; i < items.length; i++) {
    try { const r = await fn(items[i], i); results.push({ index: i, status: 'ok', ...r }); succeeded++; }
    catch (e: any) { results.push({ index: i, status: 'error', error: String(e?.message || e).slice(0, 300) }); failed++; }
  }
  return { total: items.length, succeeded, failed, results };
}

// ----- coverage computation ------------------------------------------------
async function testCaseCoverage(tc: { id: string; projectId: string }) {
  const steps = await prisma.qaTestStep.findMany({ where: { testCaseId: tc.id, isDeleted: false }, select: { id: true } });
  const stepIds = steps.map((s) => s.id);
  const total = steps.length;
  const links = await prisma.qaEntityLink.findMany({
    where: {
      projectId: tc.projectId, isDeleted: false,
      OR: [
        { sourceType: 'AutomatedTest', targetType: 'TestCase', targetId: tc.id },
        { sourceType: 'TestCase', sourceId: tc.id, targetType: 'AutomatedTest' },
        ...(stepIds.length ? [{ targetType: 'TestStep', targetId: { in: stepIds } }, { sourceType: 'TestStep', sourceId: { in: stepIds } }] : []),
      ] as any,
    },
  });
  const atIds = new Set<string>();
  for (const l of links) { if (l.sourceType === 'AutomatedTest') atIds.add(l.sourceId); if (l.targetType === 'AutomatedTest') atIds.add(l.targetId); }
  const active = atIds.size ? await prisma.qaAutomatedTest.findMany({ where: { id: { in: [...atIds] }, isDeleted: false }, select: { id: true } }) : [];
  const activeSet = new Set(active.map((a) => a.id));
  const coveredSteps = new Set<string>(); let tcLevel = false;
  for (const l of links) {
    const at = l.sourceType === 'AutomatedTest' ? l.sourceId : (l.targetType === 'AutomatedTest' ? l.targetId : null);
    if (!at || !activeSet.has(at)) continue;
    if (l.targetType === 'TestStep') coveredSteps.add(l.targetId);
    else if (l.sourceType === 'TestStep') coveredSteps.add(l.sourceId);
    else tcLevel = true;
  }
  let percent = 0; let precision = 'Unknown';
  if (total === 0) { percent = (tcLevel || coveredSteps.size > 0) ? 100 : 0; precision = tcLevel ? 'TestCaseLevel' : 'Unknown'; }
  else if (coveredSteps.size > 0 && tcLevel) { percent = 100; precision = 'Mixed'; }
  else if (coveredSteps.size > 0) { percent = Math.round((coveredSteps.size / total) * 100); precision = 'StepLevel'; }
  else if (tcLevel) { percent = 100; precision = 'TestCaseLevel'; }
  const status = percent >= 100 ? 'Automated' : (percent > 0 ? 'PartiallyAutomated' : 'NotAutomated');
  return { totalSteps: total, coveredSteps: coveredSteps.size, automationCoveragePercent: percent, coveragePrecision: precision, automationStatus: status, automatedTestIds: [...activeSet] };
}
async function recomputeTestCase(tcId: string) {
  const tc = await prisma.qaTestCase.findUnique({ where: { id: tcId } });
  if (!tc || tc.isDeleted) return null;
  const cov = await testCaseCoverage(tc);
  await prisma.qaTestCase.update({ where: { id: tcId }, data: { automationCoveragePercent: cov.automationCoveragePercent, coveragePrecision: cov.coveragePrecision, automationStatus: cov.automationStatus } });
  return cov;
}

// Recompute the stored coverage of any TestCase touched by a link change. A
// step-level link references a TestStep → resolve its parent test case.
async function recomputeTouched(pairs: Array<[string, string | null | undefined]>) {
  const tcIds = new Set<string>();
  for (const [t, id] of pairs) {
    if (!id) continue;
    if (t === 'TestCase') tcIds.add(id);
    else if (t === 'TestStep') { const st = await prisma.qaTestStep.findUnique({ where: { id } }); if (st) tcIds.add(st.testCaseId); }
  }
  for (const id of tcIds) await recomputeTestCase(id);
}

// Accept either a cuid or a human globalId (REQ-12) when linking — resolve to cuid.
async function resolveEntityId(projectId: string, type: string, val: string): Promise<string> {
  if (!val || !/^[A-Za-z]+-\d+$/.test(val)) return val;
  const gid = val.toUpperCase();
  const m: any = { Requirement: prisma.qaRequirement, TestCase: prisma.qaTestCase, Checklist: prisma.qaChecklist, AutomatedTest: prisma.qaAutomatedTest, SharedStep: prisma.qaSharedStep, TestPlan: prisma.qaTestPlan, TestRun: prisma.qaTestRun }[type];
  if (!m) return val;
  const r = await m.findFirst({ where: { projectId, globalId: gid } });
  return r?.id || val;
}

async function linkedOfType(projectId: string, type: string, id: string, otherType: string) {
  const links = await prisma.qaEntityLink.findMany({ where: { projectId, isDeleted: false, OR: [{ sourceType: type, sourceId: id }, { targetType: type, targetId: id }] } });
  const ids = new Set<string>();
  for (const l of links) {
    if (l.sourceType === type && l.sourceId === id && l.targetType === otherType) ids.add(l.targetId);
    if (l.targetType === type && l.targetId === id && l.sourceType === otherType) ids.add(l.sourceId);
  }
  return [...ids];
}

async function lastValidationForTestCases(projectId: string, tcIds: string[]) {
  if (!tcIds.length) return { status: 'NotExecuted', date: null as Date | null, failed: 0 };
  const items = await prisma.qaTestRunItem.findMany({
    where: { projectId, sourceType: 'TestCase', sourceId: { in: tcIds }, isDeleted: false, status: { not: 'NotRun' } },
    orderBy: { executedAt: 'desc' }, take: 500,
    select: { sourceId: true, status: true, executedAt: true },
  });
  const latest = new Map<string, { status: string; executedAt: Date | null }>();
  for (const it of items) { if (!latest.has(it.sourceId)) latest.set(it.sourceId, { status: it.status, executedAt: it.executedAt }); }
  const statuses = [...latest.values()].map((v) => v.status);
  let date: Date | null = null; for (const v of latest.values()) if (v.executedAt && (!date || v.executedAt > date)) date = v.executedAt;
  const failed = statuses.filter((s) => s === 'Failed').length;
  let status = 'NotExecuted';
  if (!statuses.length) status = 'NotExecuted';
  else if (failed > 0 && failed === statuses.length) status = 'Failed';
  else if (failed > 0) status = 'PartiallyFailed';
  else if (statuses.every((s) => s === 'Passed')) status = 'Passed';
  else if (statuses.includes('Blocked')) status = 'Blocked';
  else status = 'Mixed';
  return { status, date, failed };
}

async function requirementCoverage(req: { id: string; projectId: string }) {
  const tcIds = await linkedOfType(req.projectId, 'Requirement', req.id, 'TestCase');
  const clIds = await linkedOfType(req.projectId, 'Requirement', req.id, 'Checklist');
  const atIds = await linkedOfType(req.projectId, 'Requirement', req.id, 'AutomatedTest');
  const tcs = tcIds.length ? await prisma.qaTestCase.findMany({ where: { id: { in: tcIds }, isDeleted: false } }) : [];
  const autoPercents = tcs.map((t) => t.automationCoveragePercent || 0);
  const automationCoveragePercent = autoPercents.length ? Math.round(autoPercents.reduce((a, b) => a + b, 0) / autoPercents.length) : 0;
  const manualCoverageStatus = tcs.length ? (tcs.length && autoPercents.some((p) => p < 100) ? 'Covered' : 'Covered') : (clIds.length ? 'PartiallyCovered' : 'NotCovered');
  const automationCoverageStatus = automationCoveragePercent >= 100 ? 'Automated' : (automationCoveragePercent > 0 ? 'PartiallyAutomated' : 'NotAutomated');
  const val = await lastValidationForTestCases(req.projectId, tcs.map((t) => t.id));
  return {
    linkedTestCasesCount: tcs.length, linkedChecklistsCount: clIds.length, linkedAutomatedTestsCount: atIds.length,
    manualCoverageStatus, automationCoverageStatus, automationCoveragePercent,
    lastValidationStatus: val.status, lastValidationDate: val.date, failedLinkedTestsCount: val.failed,
  };
}

// ---------------------------------------------------------------------------
// API-token auth so non-browser clients (Claude Code / AI agent, CI reporters)
// can use the API-first surface without a session cookie. Set QA_API_TOKEN in env
// and send it via `x-qa-token: <token>` or `Authorization: Bearer <token>`.
function apiTokenUser(req: any): U | null {
  const expected = String(process.env.QA_API_TOKEN || '').trim();
  if (!expected) return null;
  const hdr = String(req.headers?.['x-qa-token'] || req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (hdr && hdr === expected) return { id: 'api-agent', name: 'API Agent', email: null };
  return null;
}

export async function registerQaApi(app: FastifyInstance) {
  const A = async (req: any, reply: any): Promise<U | null> => {
    const t = apiTokenUser(req); if (t) return t;
    return requireAuth(req, reply) as any;
  };

  // ===== Projects =====
  app.get('/api/qa/projects', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const rows = await prisma.qaProject.findMany({ where: { isDeleted: false }, orderBy: { createdAt: 'desc' } });
    return reply.send({ items: rows });
  });
  app.post('/api/qa/projects', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const b = req.body || {};
    if (!b.name) return reply.code(400).send({ error: 'name required' });
    const globalId = await nextGlobalId('GLOBAL', 'PRJ');
    const row = await prisma.qaProject.create({ data: { globalId, key: (b.key || b.name).toString().slice(0, 20), name: b.name, description: b.description || null, ...auth(u) } });
    return reply.code(201).send(row);
  });
  app.get('/api/qa/projects/:projectId', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const row = await prisma.qaProject.findUnique({ where: { id: req.params.projectId } });
    if (!row) return reply.code(404).send({ error: 'not found' });
    return reply.send(row);
  });
  app.patch('/api/qa/projects/:projectId', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const row = await prisma.qaProject.update({ where: { id: req.params.projectId }, data: { ...req.body, updatedBy: u.name || u.email || u.id } }).catch(() => null);
    if (!row) return reply.code(404).send({ error: 'not found' });
    return reply.send(row);
  });
  app.delete('/api/qa/projects/:projectId', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    await prisma.qaProject.update({ where: { id: req.params.projectId }, data: { isDeleted: true, deletedAt: nowIso(), deletedBy: u.name || u.email || u.id } }).catch(() => null);
    return reply.send({ ok: true });
  });
  app.post('/api/qa/projects/:projectId/restore', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    await prisma.qaProject.update({ where: { id: req.params.projectId }, data: { isDeleted: false, deletedAt: null } }).catch(() => null);
    return reply.send({ ok: true });
  });

  // ===== Generic soft delete / restore / versions (works for the versioned entities) =====
  const MODEL: Record<string, { m: any; type: string; versioned?: boolean }> = {
    requirements: { m: prisma.qaRequirement, type: 'Requirement', versioned: true },
    'test-cases': { m: prisma.qaTestCase, type: 'TestCase', versioned: true },
    checklists: { m: prisma.qaChecklist, type: 'Checklist', versioned: true },
    'shared-steps': { m: prisma.qaSharedStep, type: 'SharedStep', versioned: true },
    'automated-tests': { m: prisma.qaAutomatedTest, type: 'AutomatedTest', versioned: true },
    'test-plans': { m: prisma.qaTestPlan, type: 'TestPlan', versioned: true },
    'test-runs': { m: prisma.qaTestRun, type: 'TestRun' },
  };
  app.delete('/api/qa/:entity/:id', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const cfg = MODEL[req.params.entity]; if (!cfg) return reply.code(404).send({ error: 'unknown entity' });
    await cfg.m.update({ where: { id: req.params.id }, data: { isDeleted: true, ...(cfg.type === 'Requirement' || cfg.type === 'TestCase' ? { deletedAt: nowIso() } : {}) } }).catch(() => null);
    return reply.send({ ok: true });
  });
  app.post('/api/qa/:entity/:id/restore', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const cfg = MODEL[req.params.entity]; if (!cfg) return reply.code(404).send({ error: 'unknown entity' });
    await cfg.m.update({ where: { id: req.params.id }, data: { isDeleted: false } }).catch(() => null);
    return reply.send({ ok: true });
  });
  app.get('/api/qa/:entity/:id/versions', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const cfg = MODEL[req.params.entity]; if (!cfg) return reply.code(404).send({ error: 'unknown entity' });
    const rows = await prisma.qaVersion.findMany({ where: { entityType: cfg.type, entityId: req.params.id }, orderBy: { versionNumber: 'desc' } });
    return reply.send({ items: rows });
  });
  app.post('/api/qa/:entity/:id/versions/:version/restore', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const cfg = MODEL[req.params.entity]; if (!cfg || !cfg.versioned) return reply.code(400).send({ error: 'not versioned' });
    const v = await prisma.qaVersion.findFirst({ where: { entityType: cfg.type, entityId: req.params.id, versionNumber: parseInt(req.params.version, 10) } });
    if (!v) return reply.code(404).send({ error: 'version not found' });
    const cur = await cfg.m.findUnique({ where: { id: req.params.id } });
    if (!cur) return reply.code(404).send({ error: 'entity not found' });
    const snap: any = v.snapshotJson;
    const nextVer = (cur.currentVersionNumber || 1) + 1;
    const { id, createdAt, updatedAt, currentVersionNumber, ...restorable } = snap;
    const updated = await cfg.m.update({ where: { id: req.params.id }, data: { ...restorable, currentVersionNumber: nextVer, updatedBy: u.name || u.email || u.id } });
    await snapshot(cfg.type, updated, u.name, `restored from v${req.params.version}`, 'restore');
    return reply.send(updated);
  });

  // ===== Requirement sections =====
  app.post('/api/qa/projects/:projectId/requirement-sections', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return; const b = req.body || {};
    const row = await prisma.qaRequirementSection.create({ data: { projectId: req.params.projectId, parentId: b.parentId || null, name: b.name || 'Section', description: b.description || null, order: b.order || 0, ...auth(u) } });
    return reply.code(201).send(row);
  });
  app.get('/api/qa/projects/:projectId/requirement-sections/tree', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const rows = await prisma.qaRequirementSection.findMany({ where: { projectId: req.params.projectId, isDeleted: false }, orderBy: { order: 'asc' } });
    return reply.send({ items: rows });
  });

  // ===== Requirements =====
  const reqCreate = async (projectId: string, b: any, u: U) => {
    const globalId = await nextGlobalId(projectId, 'REQ');
    const row = await prisma.qaRequirement.create({
      data: {
        globalId, projectId, sectionId: b.sectionId || null, title: b.title || 'Requirement', description: b.description || null,
        priority: b.priority || 'Medium', status: b.status || 'Draft', type: b.type || 'Functional', owner: b.owner || null,
        implementationStatus: b.implementationStatus || 'Unknown', implementationPercent: clampPct(b.implementationPercent), implementationComment: b.implementationComment || null,
        ...auth(u),
      },
    });
    if (Array.isArray(b.sources)) for (const s of b.sources) await prisma.qaRequirementSource.create({ data: { projectId, requirementId: row.id, type: s.type || 'Other', title: s.title || null, url: s.url || null, externalId: s.externalId || null, description: s.description || null, createdBy: u.name || null } });
    if (Array.isArray(b.acceptanceCriteria)) { let o = 0; for (const t of b.acceptanceCriteria) await prisma.qaAcceptanceCriterion.create({ data: { projectId, requirementId: row.id, text: String(t), order: o++ } }); }
    await snapshot('Requirement', row, u.name, 'created');
    return row;
  };
  app.post('/api/qa/projects/:projectId/requirements', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.code(201).send(await reqCreate(req.params.projectId, req.body || {}, u)); });
  app.post('/api/qa/projects/:projectId/requirements/bulk', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const items = (req.body?.items || []); return reply.send(await runBulk(items, async (it) => { const r = await reqCreate(req.params.projectId, it, u); return { id: r.id, globalId: r.globalId, status: 'created' }; })); });
  // Import requirements from Jira (by JQL or explicit keys) → Requirement + Jira source, dedup by externalId.
  app.post('/api/qa/projects/:projectId/requirements/import-jira', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; try { return reply.send(await importJira(req.params.projectId, req.body || {}, u)); } catch (e: any) { return reply.code(400).send({ error: String(e?.message || e).slice(0, 250) }); } });
  app.get('/api/qa/jira/enabled', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send({ enabled: jiraCfg().enabled }); });
  app.get('/api/qa/projects/:projectId/requirements', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return; const q = req.query || {}; const { skip, take, page, pageSize } = listArgs(q);
    const where: any = { projectId: req.params.projectId, isDeleted: q.includeDeleted === 'true' ? undefined : false };
    if (q.priority) where.priority = q.priority; if (q.status) where.status = q.status; if (q.type) where.type = q.type; if (q.sectionId) where.sectionId = q.sectionId;
    if (q.q) where.OR = [{ title: { contains: q.q, mode: 'insensitive' } }, { globalId: { contains: q.q, mode: 'insensitive' } }];
    const [items, total] = await Promise.all([prisma.qaRequirement.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }), prisma.qaRequirement.count({ where })]);
    return reply.send({ items, total, page, pageSize });
  });
  app.get('/api/qa/requirements/:id', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const row = await prisma.qaRequirement.findUnique({ where: { id: req.params.id } });
    if (!row) return reply.code(404).send({ error: 'not found' });
    const [sources, acceptanceCriteria] = await Promise.all([
      prisma.qaRequirementSource.findMany({ where: { requirementId: row.id, isDeleted: false } }),
      prisma.qaAcceptanceCriterion.findMany({ where: { requirementId: row.id, isDeleted: false }, orderBy: { order: 'asc' } }),
    ]);
    const coverage = await requirementCoverage(row);
    // drill-down: resolve linked entities + recent run results for the impact view
    const tcIds = await linkedOfType(row.projectId, 'Requirement', row.id, 'TestCase');
    const clIds = await linkedOfType(row.projectId, 'Requirement', row.id, 'Checklist');
    const atIds = await linkedOfType(row.projectId, 'Requirement', row.id, 'AutomatedTest');
    const [linkedTestCases, linkedChecklists, linkedAutomatedTests, recentRuns] = await Promise.all([
      tcIds.length ? prisma.qaTestCase.findMany({ where: { id: { in: tcIds } }, select: { id: true, globalId: true, title: true, automationCoveragePercent: true, isDeleted: true } }) : [],
      clIds.length ? prisma.qaChecklist.findMany({ where: { id: { in: clIds } }, select: { id: true, globalId: true, title: true, isDeleted: true } }) : [],
      atIds.length ? prisma.qaAutomatedTest.findMany({ where: { id: { in: atIds } }, select: { id: true, globalId: true, name: true, framework: true, lastRunStatus: true, isDeleted: true } }) : [],
      tcIds.length ? prisma.qaTestRunItem.findMany({ where: { projectId: row.projectId, sourceType: 'TestCase', sourceId: { in: tcIds }, isDeleted: false, status: { not: 'NotRun' } }, orderBy: { executedAt: 'desc' }, take: 20, select: { titleSnapshot: true, status: true, executedAt: true, testRunId: true } }) : [],
    ]);
    return reply.send({ ...row, sources, acceptanceCriteria, coverage, linkedTestCases, linkedChecklists, linkedAutomatedTests, recentRuns });
  });
  const reqUpdate = async (id: string, b: any, u: U) => {
    const cur = await prisma.qaRequirement.findUnique({ where: { id } }); if (!cur) throw new Error('not found');
    const data: any = { updatedBy: u.name || u.email || u.id, currentVersionNumber: (cur.currentVersionNumber || 1) + 1 };
    for (const f of ['sectionId', 'title', 'description', 'priority', 'status', 'type', 'owner', 'implementationStatus', 'implementationComment']) if (b[f] !== undefined) data[f] = b[f];
    if (b.implementationPercent !== undefined) data.implementationPercent = clampPct(b.implementationPercent);
    const row = await prisma.qaRequirement.update({ where: { id }, data });
    await snapshot('Requirement', row, u.name, b.versionComment, b.changeReason);
    return row;
  };
  app.patch('/api/qa/requirements/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; try { return reply.send(await reqUpdate(req.params.id, req.body || {}, u)); } catch { return reply.code(404).send({ error: 'not found' }); } });
  app.post('/api/qa/requirements/bulk-update', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const items = req.body?.items || []; return reply.send(await runBulk(items, async (it: any) => { const r = await reqUpdate(it.id, it, u); return { id: r.id, globalId: r.globalId }; })); });
  // requirement sources
  app.post('/api/qa/requirements/:id/sources', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const r = await prisma.qaRequirement.findUnique({ where: { id: req.params.id } }); if (!r) return reply.code(404).send({ error: 'not found' }); const s = req.body || {}; const row = await prisma.qaRequirementSource.create({ data: { projectId: r.projectId, requirementId: r.id, type: s.type || 'Other', title: s.title || null, url: s.url || null, externalId: s.externalId || null, description: s.description || null, createdBy: u.name || null } }); return reply.code(201).send(row); });
  app.post('/api/qa/requirements/:id/sources/bulk', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const r = await prisma.qaRequirement.findUnique({ where: { id: req.params.id } }); if (!r) return reply.code(404).send({ error: 'not found' }); return reply.send(await runBulk(req.body?.items || [], async (s: any) => { const row = await prisma.qaRequirementSource.create({ data: { projectId: r.projectId, requirementId: r.id, type: s.type || 'Other', title: s.title || null, url: s.url || null, externalId: s.externalId || null, description: s.description || null, createdBy: u.name || null } }); return { id: row.id }; })); });
  app.delete('/api/qa/requirement-sources/:sourceId', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; await prisma.qaRequirementSource.update({ where: { id: req.params.sourceId }, data: { isDeleted: true } }).catch(() => null); return reply.send({ ok: true }); });
  // acceptance criteria
  app.post('/api/qa/requirements/:id/acceptance-criteria', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const r = await prisma.qaRequirement.findUnique({ where: { id: req.params.id } }); if (!r) return reply.code(404).send({ error: 'not found' }); const cnt = await prisma.qaAcceptanceCriterion.count({ where: { requirementId: r.id } }); const row = await prisma.qaAcceptanceCriterion.create({ data: { projectId: r.projectId, requirementId: r.id, text: req.body?.text || '', order: cnt } }); return reply.code(201).send(row); });

  // ===== Test sections (tree) =====
  app.post('/api/qa/projects/:projectId/test-sections', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const b = req.body || {}; const row = await prisma.qaTestSection.create({ data: { projectId: req.params.projectId, parentId: b.parentId || null, name: b.name || 'Section', description: b.description || null, order: b.order || 0, ...auth(u) } }); return reply.code(201).send(row); });
  app.get('/api/qa/projects/:projectId/test-sections/tree', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const rows = await prisma.qaTestSection.findMany({ where: { projectId: req.params.projectId, isDeleted: false }, orderBy: { order: 'asc' } }); return reply.send({ items: rows }); });
  app.patch('/api/qa/test-sections/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaTestSection.update({ where: { id: req.params.id }, data: { ...req.body, updatedBy: u.name } }).catch(() => null); return row ? reply.send(row) : reply.code(404).send({ error: 'not found' }); });
  app.delete('/api/qa/test-sections/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; await prisma.qaTestSection.update({ where: { id: req.params.id }, data: { isDeleted: true } }).catch(() => null); return reply.send({ ok: true }); });

  // ===== Test cases =====
  const persistSteps = async (projectId: string, testCaseId: string, steps: any[]) => {
    let o = 0;
    for (const s of (steps || [])) {
      await prisma.qaTestStep.create({ data: { projectId, testCaseId, order: s.order ?? o, action: s.action || '', expectedResult: s.expectedResult || null, sharedStepRefId: s.sharedStepRefId || null, isShared: !!s.sharedStepRefId } });
      o++;
    }
  };
  const tcCreate = async (projectId: string, b: any, u: U) => {
    const globalId = await nextGlobalId(projectId, 'TC');
    const row = await prisma.qaTestCase.create({ data: { globalId, projectId, sectionId: b.sectionId || null, title: b.title || 'Test Case', description: b.description || null, preconditions: b.preconditions || null, priority: b.priority || 'Medium', type: b.type || 'Functional', status: b.status || 'Draft', ...auth(u) } });
    await persistSteps(projectId, row.id, b.steps || []);
    if (Array.isArray(b.linkedRequirements)) for (const rid of b.linkedRequirements) await prisma.qaEntityLink.create({ data: { projectId, sourceType: 'Requirement', sourceId: rid, targetType: 'TestCase', targetId: row.id, linkType: 'covers', createdBy: u.name } });
    await snapshot('TestCase', row, u.name, 'created');
    return row;
  };
  app.post('/api/qa/projects/:projectId/test-cases', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.code(201).send(await tcCreate(req.params.projectId, req.body || {}, u)); });
  app.post('/api/qa/projects/:projectId/test-cases/bulk', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await runBulk(req.body?.items || [], async (it) => { const r = await tcCreate(req.params.projectId, it, u); return { id: r.id, globalId: r.globalId, status: 'created' }; })); });
  app.get('/api/qa/projects/:projectId/test-cases', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return; const q = req.query || {}; const { skip, take, page, pageSize } = listArgs(q);
    const where: any = { projectId: req.params.projectId, isDeleted: false };
    if (q.priority) where.priority = q.priority; if (q.type) where.type = q.type; if (q.status) where.status = q.status; if (q.automationStatus) where.automationStatus = q.automationStatus; if (q.sectionId) where.sectionId = q.sectionId;
    if (q.q) where.OR = [{ title: { contains: q.q, mode: 'insensitive' } }, { globalId: { contains: q.q, mode: 'insensitive' } }];
    const [items, total] = await Promise.all([prisma.qaTestCase.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }), prisma.qaTestCase.count({ where })]);
    return reply.send({ items, total, page, pageSize });
  });
  app.get('/api/qa/test-cases/:id', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const row = await prisma.qaTestCase.findUnique({ where: { id: req.params.id } }); if (!row) return reply.code(404).send({ error: 'not found' });
    const steps = await prisma.qaTestStep.findMany({ where: { testCaseId: row.id, isDeleted: false }, orderBy: { order: 'asc' } });
    const reqIds = await linkedOfType(row.projectId, 'TestCase', row.id, 'Requirement');
    const atIds = await linkedOfType(row.projectId, 'TestCase', row.id, 'AutomatedTest');
    const coverage = await testCaseCoverage(row);
    return reply.send({ ...row, steps, linkedRequirementIds: reqIds, linkedAutomatedTestIds: atIds, coverage });
  });
  const tcUpdate = async (id: string, b: any, u: U) => {
    const cur = await prisma.qaTestCase.findUnique({ where: { id } }); if (!cur) throw new Error('not found');
    const data: any = { updatedBy: u.name, currentVersionNumber: (cur.currentVersionNumber || 1) + 1 };
    for (const f of ['sectionId', 'title', 'description', 'preconditions', 'priority', 'type', 'status']) if (b[f] !== undefined) data[f] = b[f];
    const row = await prisma.qaTestCase.update({ where: { id }, data });
    if (Array.isArray(b.steps)) { await prisma.qaTestStep.updateMany({ where: { testCaseId: id }, data: { isDeleted: true } }); await persistSteps(cur.projectId, id, b.steps); }
    await snapshot('TestCase', row, u.name, b.versionComment);
    await recomputeTestCase(id);
    return row;
  };
  app.patch('/api/qa/test-cases/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; try { return reply.send(await tcUpdate(req.params.id, req.body || {}, u)); } catch { return reply.code(404).send({ error: 'not found' }); } });
  app.post('/api/qa/test-cases/bulk-update', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await runBulk(req.body?.items || [], async (it: any) => { const r = await tcUpdate(it.id, it, u); return { id: r.id }; })); });
  // convert selected steps → shared step
  app.post('/api/qa/test-cases/:id/steps/convert-to-shared-step', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return; const tc = await prisma.qaTestCase.findUnique({ where: { id: req.params.id } }); if (!tc) return reply.code(404).send({ error: 'not found' });
    const stepIds: string[] = req.body?.stepIds || []; const title = req.body?.title || 'Shared step';
    const steps = await prisma.qaTestStep.findMany({ where: { id: { in: stepIds }, testCaseId: tc.id, isDeleted: false }, orderBy: { order: 'asc' } });
    if (!steps.length) return reply.code(400).send({ error: 'no steps' });
    const gid = await nextGlobalId(tc.projectId, 'SS');
    const ss = await prisma.qaSharedStep.create({ data: { globalId: gid, projectId: tc.projectId, title, ...auth(u) } });
    let o = 0; for (const s of steps) await prisma.qaSharedStepItem.create({ data: { projectId: tc.projectId, sharedStepId: ss.id, order: o++, action: s.action, expectedResult: s.expectedResult } });
    // replace first selected step by reference, soft-delete the rest
    await prisma.qaTestStep.update({ where: { id: steps[0].id }, data: { action: title, expectedResult: null, sharedStepRefId: ss.id, isShared: true } });
    for (const s of steps.slice(1)) await prisma.qaTestStep.update({ where: { id: s.id }, data: { isDeleted: true } });
    await snapshot('SharedStep', ss, u.name, 'created from test case steps');
    return reply.code(201).send(ss);
  });

  // ===== Shared steps =====
  const ssCreate = async (projectId: string, b: any, u: U) => {
    const gid = await nextGlobalId(projectId, 'SS');
    const ss = await prisma.qaSharedStep.create({ data: { globalId: gid, projectId, sectionId: b.sectionId || null, title: b.title || 'Shared step', description: b.description || null, ...auth(u) } });
    let o = 0; for (const s of (b.steps || [])) await prisma.qaSharedStepItem.create({ data: { projectId, sharedStepId: ss.id, order: s.order ?? o++, action: s.action || '', expectedResult: s.expectedResult || null } });
    await snapshot('SharedStep', ss, u.name, 'created');
    return ss;
  };
  app.post('/api/qa/projects/:projectId/shared-steps', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.code(201).send(await ssCreate(req.params.projectId, req.body || {}, u)); });
  app.post('/api/qa/projects/:projectId/shared-steps/bulk', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await runBulk(req.body?.items || [], async (it) => { const r = await ssCreate(req.params.projectId, it, u); return { id: r.id, globalId: r.globalId }; })); });
  app.get('/api/qa/projects/:projectId/shared-steps', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const rows = await prisma.qaSharedStep.findMany({ where: { projectId: req.params.projectId, isDeleted: false }, orderBy: { createdAt: 'desc' } }); return reply.send({ items: rows }); });
  app.get('/api/qa/shared-steps/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaSharedStep.findUnique({ where: { id: req.params.id } }); if (!row) return reply.code(404).send({ error: 'not found' }); const items = await prisma.qaSharedStepItem.findMany({ where: { sharedStepId: row.id, isDeleted: false }, orderBy: { order: 'asc' } }); return reply.send({ ...row, steps: items }); });
  app.patch('/api/qa/shared-steps/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const cur = await prisma.qaSharedStep.findUnique({ where: { id: req.params.id } }); if (!cur) return reply.code(404).send({ error: 'not found' }); const b = req.body || {}; const row = await prisma.qaSharedStep.update({ where: { id: req.params.id }, data: { title: b.title ?? cur.title, description: b.description ?? cur.description, updatedBy: u.name, currentVersionNumber: (cur.currentVersionNumber || 1) + 1 } }); if (Array.isArray(b.steps)) { await prisma.qaSharedStepItem.updateMany({ where: { sharedStepId: row.id }, data: { isDeleted: true } }); let o = 0; for (const s of b.steps) await prisma.qaSharedStepItem.create({ data: { projectId: cur.projectId, sharedStepId: row.id, order: o++, action: s.action || '', expectedResult: s.expectedResult || null } }); } await snapshot('SharedStep', row, u.name); return reply.send(row); });

  // ===== Checklists =====
  const clCreate = async (projectId: string, b: any, u: U) => {
    const gid = await nextGlobalId(projectId, 'CL');
    const cl = await prisma.qaChecklist.create({ data: { globalId: gid, projectId, sectionId: b.sectionId || null, title: b.title || 'Checklist', description: b.description || null, type: b.type || 'Functional', status: b.status || 'Draft', ...auth(u) } });
    let o = 0; for (const it of (b.items || [])) await prisma.qaChecklistItem.create({ data: { projectId, checklistId: cl.id, order: o++, title: typeof it === 'string' ? it : (it.title || '') } });
    await snapshot('Checklist', cl, u.name, 'created');
    return cl;
  };
  app.post('/api/qa/projects/:projectId/checklists', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.code(201).send(await clCreate(req.params.projectId, req.body || {}, u)); });
  app.post('/api/qa/projects/:projectId/checklists/bulk', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await runBulk(req.body?.items || [], async (it) => { const r = await clCreate(req.params.projectId, it, u); return { id: r.id, globalId: r.globalId }; })); });
  app.get('/api/qa/projects/:projectId/checklists', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const rows = await prisma.qaChecklist.findMany({ where: { projectId: req.params.projectId, isDeleted: false }, orderBy: { createdAt: 'desc' } }); return reply.send({ items: rows }); });
  app.get('/api/qa/checklists/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaChecklist.findUnique({ where: { id: req.params.id } }); if (!row) return reply.code(404).send({ error: 'not found' }); const items = await prisma.qaChecklistItem.findMany({ where: { checklistId: row.id, isDeleted: false }, orderBy: { order: 'asc' } }); return reply.send({ ...row, items }); });
  app.patch('/api/qa/checklists/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const cur = await prisma.qaChecklist.findUnique({ where: { id: req.params.id } }); if (!cur) return reply.code(404).send({ error: 'not found' }); const b = req.body || {}; const row = await prisma.qaChecklist.update({ where: { id: req.params.id }, data: { title: b.title ?? cur.title, description: b.description ?? cur.description, type: b.type ?? cur.type, status: b.status ?? cur.status, updatedBy: u.name, currentVersionNumber: (cur.currentVersionNumber || 1) + 1 } }); if (Array.isArray(b.items)) { await prisma.qaChecklistItem.updateMany({ where: { checklistId: row.id }, data: { isDeleted: true } }); let o = 0; for (const it of b.items) await prisma.qaChecklistItem.create({ data: { projectId: cur.projectId, checklistId: row.id, order: o++, title: typeof it === 'string' ? it : (it.title || '') } }); } await snapshot('Checklist', row, u.name); return reply.send(row); });
  // expand checklist → test cases (one TC per item)
  app.post('/api/qa/checklists/:id/expand-to-test-cases', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return; const cl = await prisma.qaChecklist.findUnique({ where: { id: req.params.id } }); if (!cl) return reply.code(404).send({ error: 'not found' });
    const items = await prisma.qaChecklistItem.findMany({ where: { checklistId: cl.id, isDeleted: false }, orderBy: { order: 'asc' } });
    const created: any[] = [];
    for (const it of items) {
      const gid = await nextGlobalId(cl.projectId, 'TC');
      const tc = await prisma.qaTestCase.create({ data: { globalId: gid, projectId: cl.projectId, sectionId: cl.sectionId, title: it.title, type: cl.type, priority: 'Medium', status: 'Draft', ...auth(u) } });
      await prisma.qaTestStep.create({ data: { projectId: cl.projectId, testCaseId: tc.id, order: 0, action: it.title, expectedResult: 'Expected behavior is correct' } });
      await prisma.qaEntityLink.create({ data: { projectId: cl.projectId, sourceType: 'Checklist', sourceId: cl.id, targetType: 'TestCase', targetId: tc.id, linkType: 'derived_from', createdBy: u.name } });
      await snapshot('TestCase', tc, u.name, `expanded from checklist ${cl.globalId}`);
      created.push({ id: tc.id, globalId: tc.globalId, title: tc.title });
    }
    return reply.code(201).send({ total: items.length, created });
  });

  // ===== Automated tests =====
  app.post('/api/qa/projects/:projectId/automated-tests', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.code(201).send(await atUpsert(req.params.projectId, req.body || {}, u, false)); });
  app.post('/api/qa/projects/:projectId/automated-tests/upsert', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await atUpsert(req.params.projectId, req.body || {}, u, true)); });
  app.post('/api/qa/projects/:projectId/automated-tests/bulk-upsert', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await runBulk(req.body?.items || [], async (it) => { const r = await atUpsert(req.params.projectId, it, u, true); return { id: r.id, globalId: r.globalId, externalId: r.externalId }; })); });
  app.get('/api/qa/projects/:projectId/automated-tests', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const q = req.query || {}; const { skip, take, page, pageSize } = listArgs(q); const where: any = { projectId: req.params.projectId, isDeleted: false }; if (q.framework) where.framework = q.framework; if (q.status) where.status = q.status; if (q.externalId) where.externalId = { contains: q.externalId }; if (q.q) where.OR = [{ name: { contains: q.q, mode: 'insensitive' } }, { globalId: { contains: q.q, mode: 'insensitive' } }, { externalId: { contains: q.q, mode: 'insensitive' } }]; const [items, total] = await Promise.all([prisma.qaAutomatedTest.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take }), prisma.qaAutomatedTest.count({ where })]); return reply.send({ items, total, page, pageSize }); });
  app.get('/api/qa/automated-tests/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaAutomatedTest.findUnique({ where: { id: req.params.id } }); if (!row) return reply.code(404).send({ error: 'not found' }); const tcIds = await linkedOfType(row.projectId, 'AutomatedTest', row.id, 'TestCase'); return reply.send({ ...row, linkedTestCaseIds: tcIds }); });
  app.patch('/api/qa/automated-tests/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaAutomatedTest.update({ where: { id: req.params.id }, data: { ...stripUndef(req.body, ['name', 'description', 'framework', 'suiteName', 'filePath', 'testName', 'fullName', 'status', 'tags']), updatedBy: u.name } }).catch(() => null); return row ? reply.send(row) : reply.code(404).send({ error: 'not found' }); });

  // ===== Entity links =====
  const linkCreate = async (projectId: string, b: any, u: U) => {
    const sourceId = await resolveEntityId(projectId, b.sourceType, b.sourceId);
    const targetId = await resolveEntityId(projectId, b.targetType, b.targetId);
    const row = await prisma.qaEntityLink.create({ data: { projectId, sourceType: b.sourceType, sourceId, targetType: b.targetType, targetId, targetStepId: b.targetStepId || null, linkType: b.linkType || 'covers', coverageType: b.coverageType || null, coverageWeight: b.coverageWeight ?? null, createdBy: u.name } });
    b = { ...b, sourceId, targetId };
    await recomputeTouched([[b.sourceType, b.sourceId], [b.targetType, b.targetId], ['TestStep', b.targetStepId]]);
    return row;
  };
  app.post('/api/qa/projects/:projectId/links', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.code(201).send(await linkCreate(req.params.projectId, req.body || {}, u)); });
  app.post('/api/qa/projects/:projectId/links/bulk', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await runBulk(req.body?.items || [], async (it) => { const r = await linkCreate(req.params.projectId, it, u); return { id: r.id }; })); });
  app.get('/api/qa/projects/:projectId/links', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const q = req.query || {}; const where: any = { projectId: req.params.projectId, isDeleted: false }; if (q.sourceType) where.sourceType = q.sourceType; if (q.sourceId) where.sourceId = q.sourceId; if (q.targetType) where.targetType = q.targetType; if (q.targetId) where.targetId = q.targetId; const rows = await prisma.qaEntityLink.findMany({ where, take: 2000 }); return reply.send({ items: rows }); });
  app.delete('/api/qa/links/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const l = await prisma.qaEntityLink.findUnique({ where: { id: req.params.id } }); await prisma.qaEntityLink.update({ where: { id: req.params.id }, data: { isDeleted: true } }).catch(() => null); if (l) await recomputeTouched([[l.sourceType, l.sourceId], [l.targetType, l.targetId], ['TestStep', l.targetStepId]]); return reply.send({ ok: true }); });

  // ===== Test plans =====
  app.post('/api/qa/projects/:projectId/test-plans', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const b = req.body || {}; const gid = await nextGlobalId(req.params.projectId, 'TP'); const tp = await prisma.qaTestPlan.create({ data: { globalId: gid, projectId: req.params.projectId, title: b.title || 'Test Plan', description: b.description || null, type: b.type || 'Custom', status: b.status || 'Draft', ...auth(u) } }); if (Array.isArray(b.items)) await addPlanItems(tp, b.items); await snapshot('TestPlan', tp, u.name, 'created'); return reply.code(201).send(tp); });
  app.get('/api/qa/projects/:projectId/test-plans', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const rows = await prisma.qaTestPlan.findMany({ where: { projectId: req.params.projectId, isDeleted: false }, orderBy: { createdAt: 'desc' } }); return reply.send({ items: rows }); });
  app.get('/api/qa/test-plans/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaTestPlan.findUnique({ where: { id: req.params.id } }); if (!row) return reply.code(404).send({ error: 'not found' }); const items = await prisma.qaTestPlanItem.findMany({ where: { testPlanId: row.id, isDeleted: false }, orderBy: { order: 'asc' } }); return reply.send({ ...row, items }); });
  app.patch('/api/qa/test-plans/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaTestPlan.update({ where: { id: req.params.id }, data: { ...stripUndef(req.body, ['title', 'description', 'type', 'status']), updatedBy: u.name } }).catch(() => null); return row ? reply.send(row) : reply.code(404).send({ error: 'not found' }); });
  app.post('/api/qa/test-plans/:id/items', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const tp = await prisma.qaTestPlan.findUnique({ where: { id: req.params.id } }); if (!tp) return reply.code(404).send({ error: 'not found' }); await addPlanItems(tp, [req.body]); return reply.code(201).send({ ok: true }); });
  app.post('/api/qa/test-plans/:id/items/bulk', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const tp = await prisma.qaTestPlan.findUnique({ where: { id: req.params.id } }); if (!tp) return reply.code(404).send({ error: 'not found' }); await addPlanItems(tp, req.body?.items || []); return reply.send({ ok: true, added: (req.body?.items || []).length }); });
  app.delete('/api/qa/test-plans/:id/items/:itemId', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; await prisma.qaTestPlanItem.update({ where: { id: req.params.itemId }, data: { isDeleted: true } }).catch(() => null); return reply.send({ ok: true }); });

  // ===== Test runs =====
  app.post('/api/qa/projects/:projectId/test-runs', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.code(201).send(await createRun(req.params.projectId, req.body || {}, u)); });
  app.post('/api/qa/test-plans/:testPlanId/runs', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const tp = await prisma.qaTestPlan.findUnique({ where: { id: req.params.testPlanId } }); if (!tp) return reply.code(404).send({ error: 'not found' }); return reply.code(201).send(await createRun(tp.projectId, { ...req.body, testPlanId: tp.id }, u)); });
  app.get('/api/qa/projects/:projectId/test-runs', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const rows = await prisma.qaTestRun.findMany({ where: { projectId: req.params.projectId, isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 200 }); return reply.send({ items: rows }); });
  app.get('/api/qa/test-runs/:id', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaTestRun.findUnique({ where: { id: req.params.id } }); if (!row) return reply.code(404).send({ error: 'not found' }); const items = await prisma.qaTestRunItem.findMany({ where: { testRunId: row.id, isDeleted: false } }); const counts: any = {}; for (const it of items) counts[it.status] = (counts[it.status] || 0) + 1; return reply.send({ ...row, items, counts }); });
  app.post('/api/qa/test-runs/:id/start', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaTestRun.update({ where: { id: req.params.id }, data: { status: 'Running', startedAt: nowIso() } }).catch(() => null); await prisma.qaTestRunEvent.create({ data: { projectId: row?.projectId || '', testRunId: req.params.id, eventType: 'RunStarted' } }).catch(() => {}); return row ? reply.send(row) : reply.code(404).send({ error: 'not found' }); });
  app.post('/api/qa/test-runs/:id/finish', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaTestRun.update({ where: { id: req.params.id }, data: { status: 'Completed', finishedAt: nowIso() } }).catch(() => null); await prisma.qaTestRunEvent.create({ data: { projectId: row?.projectId || '', testRunId: req.params.id, eventType: 'RunFinished' } }).catch(() => {}); return row ? reply.send(row) : reply.code(404).send({ error: 'not found' }); });
  app.post('/api/qa/test-runs/:id/cancel', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const row = await prisma.qaTestRun.update({ where: { id: req.params.id }, data: { status: 'Cancelled', finishedAt: nowIso() } }).catch(() => null); return row ? reply.send(row) : reply.code(404).send({ error: 'not found' }); });
  // results
  app.post('/api/qa/test-runs/:runId/items/:itemId/result', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await applyResult(req.params.runId, req.params.itemId, req.body || {}, u, 'Manual')); });
  app.post('/api/qa/test-runs/:runId/results/bulk', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await runBulk(req.body?.items || [], async (it: any) => { const r = await resultByExternalOrItem(req.params.runId, it, u); return { itemId: r?.id || null, status: it.status }; })); });
  app.post('/api/qa/test-runs/:runId/events', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await ingestEvent(req.params.runId, req.body || {})); });
  app.post('/api/qa/test-runs/:runId/events/bulk', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send(await runBulk(req.body?.events || req.body?.items || [], async (e: any) => { await ingestEvent(req.params.runId, e); return { eventId: e.eventId || null }; })); });

  // ===== Coverage =====
  app.get('/api/qa/projects/:projectId/coverage/requirements', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const reqs = await prisma.qaRequirement.findMany({ where: { projectId: req.params.projectId, isDeleted: false } }); const out = []; for (const r of reqs) out.push({ id: r.id, globalId: r.globalId, title: r.title, priority: r.priority, status: r.status, implementationPercent: r.implementationPercent, ...(await requirementCoverage(r)) }); return reply.send({ items: out }); });
  app.get('/api/qa/projects/:projectId/coverage/test-cases', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const tcs = await prisma.qaTestCase.findMany({ where: { projectId: req.params.projectId, isDeleted: false } }); const out = []; for (const t of tcs) { const c = await testCaseCoverage(t); out.push({ id: t.id, globalId: t.globalId, title: t.title, ...c }); } return reply.send({ items: out }); });
  app.get('/api/qa/projects/:projectId/coverage/automation', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const tcs = await prisma.qaTestCase.findMany({ where: { projectId: req.params.projectId, isDeleted: false } }); const avg = tcs.length ? Math.round(tcs.reduce((a, b) => a + (b.automationCoveragePercent || 0), 0) / tcs.length) : 0; return reply.send({ averageAutomationCoveragePercent: avg, totalTestCases: tcs.length, automated: tcs.filter((t) => t.automationStatus === 'Automated').length, partial: tcs.filter((t) => t.automationStatus === 'PartiallyAutomated').length }); });
  app.get('/api/qa/requirements/:id/coverage', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const r = await prisma.qaRequirement.findUnique({ where: { id: req.params.id } }); if (!r) return reply.code(404).send({ error: 'not found' }); return reply.send(await requirementCoverage(r)); });
  app.get('/api/qa/test-cases/:id/coverage', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; const t = await prisma.qaTestCase.findUnique({ where: { id: req.params.id } }); if (!t) return reply.code(404).send({ error: 'not found' }); return reply.send(await testCaseCoverage(t)); });

  // ===== Traceability matrix =====
  app.get('/api/qa/projects/:projectId/traceability', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return;
    const reqs = await prisma.qaRequirement.findMany({ where: { projectId: req.params.projectId, isDeleted: false }, orderBy: { globalId: 'asc' } });
    const rows = [];
    for (const r of reqs) {
      const cov = await requirementCoverage(r);
      let coverageStatus = 'NotCovered';
      if (cov.lastValidationStatus === 'Failed' || cov.lastValidationStatus === 'PartiallyFailed') coverageStatus = 'FailedLastRun';
      else if (cov.automationCoveragePercent >= 100) coverageStatus = 'CoveredByAutomatedTests';
      else if (cov.automationCoveragePercent > 0) coverageStatus = 'PartiallyAutomated';
      else if (cov.linkedTestCasesCount > 0) coverageStatus = 'CoveredByManualTests';
      rows.push({ requirementId: r.id, globalId: r.globalId, title: r.title, priority: r.priority, status: r.status, implementationStatus: r.implementationStatus, implementationPercent: r.implementationPercent, ...cov, coverageStatus });
    }
    return reply.send({ items: rows });
  });

  // ===== Dashboards =====
  app.get('/api/qa/projects/:projectId/dashboard/summary', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return; const p = req.params.projectId;
    const [reqs, tcs, ats, runs] = await Promise.all([
      prisma.qaRequirement.findMany({ where: { projectId: p, isDeleted: false } }),
      prisma.qaTestCase.findMany({ where: { projectId: p, isDeleted: false } }),
      prisma.qaAutomatedTest.count({ where: { projectId: p, isDeleted: false } }),
      prisma.qaTestRun.findMany({ where: { projectId: p, isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 1 }),
    ]);
    // covered requirements (have ≥1 linked test case)
    let coveredReq = 0; let criticalUncovered = 0;
    for (const r of reqs) { const tcIds = await linkedOfType(p, 'Requirement', r.id, 'TestCase'); if (tcIds.length) coveredReq++; else if (r.priority === 'Critical') criticalUncovered++; }
    const avgAuto = tcs.length ? Math.round(tcs.reduce((a, b) => a + (b.automationCoveragePercent || 0), 0) / tcs.length) : 0;
    return reply.send({
      requirementsTotal: reqs.length,
      requirementsImplemented: reqs.filter((r) => r.implementationStatus === 'Implemented').length,
      requirementsPartiallyImplemented: reqs.filter((r) => r.implementationStatus === 'PartiallyImplemented').length,
      requirementsNotCovered: reqs.length - coveredReq,
      requirementsCovered: coveredReq,
      criticalUncoveredRequirements: criticalUncovered,
      testCasesTotal: tcs.length,
      testCasesAutomated: tcs.filter((t) => t.automationStatus === 'Automated').length,
      testCasesPartiallyAutomated: tcs.filter((t) => t.automationStatus === 'PartiallyAutomated').length,
      averageAutomationCoverage: avgAuto,
      automatedTestsTotal: ats,
      lastTestRun: runs[0] || null,
    });
  });
  app.get('/api/qa/projects/:projectId/dashboard/execution', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return; const p = req.params.projectId;
    const runs = await prisma.qaTestRun.findMany({ where: { projectId: p, isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 10 });
    const items = await prisma.qaTestRunItem.findMany({ where: { projectId: p, isDeleted: false }, select: { status: true, hangingStatus: true, durationMs: true } });
    const by = (s: string) => items.filter((i) => i.status === s).length;
    return reply.send({ recentRuns: runs, passed: by('Passed'), failed: by('Failed'), blocked: by('Blocked'), skipped: by('Skipped'), notRun: by('NotRun'), hanging: items.filter((i) => i.hangingStatus !== 'Normal').length });
  });

  // ===== Prometheus metrics =====
  app.get('/api/qa/projects/:projectId/metrics', async (req: any, reply) => {
    const u = await A(req, reply); if (!u) return; const p = req.params.projectId;
    const [reqTotal, reqImpl, reqPart, tcTotal, tcAuto, atTotal, runTotal] = await Promise.all([
      prisma.qaRequirement.count({ where: { projectId: p, isDeleted: false } }),
      prisma.qaRequirement.count({ where: { projectId: p, isDeleted: false, implementationStatus: 'Implemented' } }),
      prisma.qaRequirement.count({ where: { projectId: p, isDeleted: false, implementationStatus: 'PartiallyImplemented' } }),
      prisma.qaTestCase.count({ where: { projectId: p, isDeleted: false } }),
      prisma.qaTestCase.count({ where: { projectId: p, isDeleted: false, automationStatus: 'Automated' } }),
      prisma.qaAutomatedTest.count({ where: { projectId: p, isDeleted: false } }),
      prisma.qaTestRun.count({ where: { projectId: p, isDeleted: false } }),
    ]);
    const passed = await prisma.qaTestRunItem.count({ where: { projectId: p, isDeleted: false, status: 'Passed' } });
    const failed = await prisma.qaTestRunItem.count({ where: { projectId: p, isDeleted: false, status: 'Failed' } });
    const blocked = await prisma.qaTestRunItem.count({ where: { projectId: p, isDeleted: false, status: 'Blocked' } });
    const skipped = await prisma.qaTestRunItem.count({ where: { projectId: p, isDeleted: false, status: 'Skipped' } });
    const hanging = await prisma.qaTestRunItem.count({ where: { projectId: p, isDeleted: false, hangingStatus: { not: 'Normal' } } });
    // coverage gauges
    const tcsForCov = await prisma.qaTestCase.findMany({ where: { projectId: p, isDeleted: false }, select: { automationCoveragePercent: true } });
    const autoCov = tcsForCov.length ? Math.round(tcsForCov.reduce((a, b) => a + (b.automationCoveragePercent || 0), 0) / tcsForCov.length) : 0;
    const reqsForCov = await prisma.qaRequirement.findMany({ where: { projectId: p, isDeleted: false }, select: { id: true } });
    let reqCovered = 0; for (const r of reqsForCov) { const ids = await linkedOfType(p, 'Requirement', r.id, 'TestCase'); if (ids.length) reqCovered++; }
    const reqCovPct = reqsForCov.length ? Math.round((reqCovered / reqsForCov.length) * 100) : 0;
    const lines = [
      `tms_requirements_total ${reqTotal}`, `tms_requirements_implemented_total ${reqImpl}`, `tms_requirements_partially_implemented_total ${reqPart}`,
      `tms_requirements_not_covered_total ${reqsForCov.length - reqCovered}`,
      `tms_test_cases_total ${tcTotal}`, `tms_test_cases_automated_total ${tcAuto}`, `tms_automated_tests_total ${atTotal}`,
      `tms_test_runs_total ${runTotal}`, `tms_test_run_items_passed_total ${passed}`, `tms_test_run_items_failed_total ${failed}`,
      `tms_test_run_items_blocked_total ${blocked}`, `tms_test_run_items_skipped_total ${skipped}`, `tms_hanging_tests_total ${hanging}`,
      `tms_automation_coverage_percent ${autoCov}`, `tms_requirement_coverage_percent ${reqCovPct}`,
    ];
    reply.header('Content-Type', 'text/plain; version=0.0.4');
    return reply.send(lines.join('\n') + '\n');
  });

  // ===== Global search =====
  const doSearch = async (projectId: string | null, query: string) => {
    const out: any[] = []; const q = query.trim();
    const idMatch = q.match(/^([A-Za-z]+)-(\d+)$/);
    const where = (extra: any) => ({ isDeleted: false, ...(projectId ? { projectId } : {}), ...extra });
    const text = { contains: q, mode: 'insensitive' as const };
    const push = (entityType: string, r: any, name: string, url: string) => out.push({ entityType, id: r.id, globalId: r.globalId, title: name, isDeleted: r.isDeleted, directUrl: url });
    const lim = 15;
    if (idMatch) {
      const gq = q.toUpperCase();
      for (const [model, type, url] of [[prisma.qaRequirement, 'Requirement', 'requirements'], [prisma.qaTestCase, 'TestCase', 'test-cases'], [prisma.qaChecklist, 'Checklist', 'checklists'], [prisma.qaSharedStep, 'SharedStep', 'shared-steps'], [prisma.qaAutomatedTest, 'AutomatedTest', 'automation'], [prisma.qaTestPlan, 'TestPlan', 'test-plans'], [prisma.qaTestRun, 'TestRun', 'test-runs']] as any[]) {
        const r = await model.findFirst({ where: { globalId: gq, ...(projectId ? { projectId } : {}) } }); if (r) push(type, r, r.title || r.name, `/qa/${url}/${r.id}`);
      }
      return out;
    }
    const [reqs, tcs, cls, ats] = await Promise.all([
      prisma.qaRequirement.findMany({ where: where({ title: text }), take: lim }),
      prisma.qaTestCase.findMany({ where: where({ title: text }), take: lim }),
      prisma.qaChecklist.findMany({ where: where({ title: text }), take: lim }),
      prisma.qaAutomatedTest.findMany({ where: where({ name: text }), take: lim }),
    ]);
    reqs.forEach((r) => push('Requirement', r, r.title, `/qa/requirements/${r.id}`));
    tcs.forEach((r) => push('TestCase', r, r.title, `/qa/test-cases/${r.id}`));
    cls.forEach((r) => push('Checklist', r, r.title, `/qa/checklists/${r.id}`));
    ats.forEach((r) => push('AutomatedTest', r, r.name, `/qa/automation/${r.id}`));
    return out;
  };
  app.get('/api/qa/search', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send({ items: await doSearch(null, String(req.query?.query || '')) }); });
  app.get('/api/qa/projects/:projectId/search', async (req: any, reply) => { const u = await A(req, reply); if (!u) return; return reply.send({ items: await doSearch(req.params.projectId, String(req.query?.query || '')) }); });
}

// ----- helpers used above (module scope, after registration for hoisting) -----
function clampPct(v: any) { const n = parseInt(v, 10); if (isNaN(n)) return 0; return Math.max(0, Math.min(100, n)); }

// --- Jira import (reuses the app's JIRA_* creds) → Requirements + Jira sources ---
function jiraCfg() {
  const baseUrl = String(process.env.JIRA_BASE_URL || 'https://shiptify.atlassian.net').replace(/\/$/, '');
  const email = String(process.env.JIRA_EMAIL || '').trim();
  const token = String(process.env.JIRA_API_TOKEN || '').trim();
  return { baseUrl, email, token, enabled: !!(baseUrl && email && token) };
}
async function jiraGet(apiPath: string) {
  const { baseUrl, email, token } = jiraCfg();
  const res = await fetch(`${baseUrl}${apiPath}`, { headers: { Authorization: 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64'), Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Jira ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
function jiraAdfText(node: any): string {
  if (!node) return ''; if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(jiraAdfText).join('');
  if (node.type === 'text') return node.text || ''; if (node.type === 'hardBreak') return '\n';
  if (node.content) { const inner = jiraAdfText(node.content); return /paragraph|heading|listItem/.test(node.type) ? inner + '\n' : inner; }
  return '';
}
function mapJiraPriority(p: string) { const s = (p || '').toLowerCase(); if (/highest|critical|blocker/.test(s)) return 'Critical'; if (/high/.test(s)) return 'High'; if (/low|lowest|minor|trivial/.test(s)) return 'Low'; return 'Medium'; }
async function importJira(projectId: string, opts: { jql?: string; keys?: string[]; maxResults?: number }, u: U) {
  const cfg = jiraCfg(); if (!cfg.enabled) throw new Error('Jira не настроена (JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN)');
  let issues: any[] = [];
  if (opts.keys && opts.keys.length) { for (const k of opts.keys.slice(0, 100)) { try { issues.push(await jiraGet(`/rest/api/2/issue/${encodeURIComponent(k)}?fields=summary,description,priority,issuetype,labels,status`)); } catch { /* skip */ } } }
  else { const jql = opts.jql || 'ORDER BY created DESC'; const data = await jiraGet(`/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${Math.min(100, opts.maxResults || 50)}&fields=summary,description,priority,issuetype,labels,status`); issues = data.issues || []; }
  const by = u.name || 'API Agent';
  const results: any[] = []; let succeeded = 0; let failed = 0;
  for (const it of issues) {
    try {
      const key = it.key; const f = it.fields || {};
      const existing = await prisma.qaRequirementSource.findFirst({ where: { projectId, type: 'Jira', externalId: key, isDeleted: false } });
      if (existing) { results.push({ key, status: 'skipped', reason: 'already imported', requirementId: existing.requirementId }); succeeded++; continue; }
      const gid = await nextGlobalId(projectId, 'REQ');
      const desc = typeof f.description === 'string' ? f.description : jiraAdfText(f.description);
      const req = await prisma.qaRequirement.create({ data: { globalId: gid, projectId, title: f.summary || key, description: (desc || '').slice(0, 8000), priority: mapJiraPriority(f.priority?.name), type: 'Functional', status: 'Draft', createdBy: by, updatedBy: by } });
      await prisma.qaRequirementSource.create({ data: { projectId, requirementId: req.id, type: 'Jira', externalId: key, url: `${cfg.baseUrl}/browse/${key}`, title: f.summary || key, createdBy: by } });
      await snapshot('Requirement', req, by, `imported from Jira ${key}`);
      results.push({ key, status: 'created', requirementId: req.id, globalId: req.globalId }); succeeded++;
    } catch (e: any) { results.push({ key: it.key, status: 'error', error: String(e?.message || e).slice(0, 200) }); failed++; }
  }
  return { total: issues.length, succeeded, failed, results };
}
function stripUndef(b: any, fields: string[]) { const o: any = {}; for (const f of fields) if (b?.[f] !== undefined) o[f] = b[f]; return o; }

async function atUpsert(projectId: string, b: any, u: U, allowUpdate: boolean) {
  const by = u.name || u.email || u.id;
  if (allowUpdate && b.externalId) {
    const existing = await prisma.qaAutomatedTest.findFirst({ where: { projectId, externalId: b.externalId } });
    if (existing) {
      const row = await prisma.qaAutomatedTest.update({ where: { id: existing.id }, data: { name: b.name ?? existing.name, description: b.description ?? existing.description, framework: b.framework ?? existing.framework, suiteName: b.suiteName ?? existing.suiteName, filePath: b.filePath ?? existing.filePath, testName: b.testName ?? existing.testName, fullName: b.fullName ?? existing.fullName, tags: b.tags ?? existing.tags, status: b.status ?? existing.status, lastRunStatus: b.lastRunStatus ?? existing.lastRunStatus, lastRunAt: b.lastRunStatus ? new Date() : existing.lastRunAt, lastDurationMs: b.lastDurationMs ?? existing.lastDurationMs, isDeleted: false, updatedBy: by } });
      return row;
    }
  }
  const gid = await nextGlobalId(projectId, 'AT');
  const row = await prisma.qaAutomatedTest.create({ data: { globalId: gid, projectId, externalId: b.externalId || null, name: b.name || b.fullName || b.testName || 'Automated test', description: b.description || null, framework: b.framework || 'Other', suiteName: b.suiteName || null, filePath: b.filePath || null, testName: b.testName || null, fullName: b.fullName || null, tags: b.tags || [], status: b.status || 'Active', createdBy: by, updatedBy: by } });
  return row;
}

async function addPlanItems(tp: { id: string; projectId: string }, items: any[]) {
  let o = await prisma.qaTestPlanItem.count({ where: { testPlanId: tp.id } });
  for (const it of (items || [])) {
    await prisma.qaTestPlanItem.create({ data: { projectId: tp.projectId, testPlanId: tp.id, sourceType: it.sourceType || 'TestCase', sourceId: it.sourceId, sourceVersionNumber: it.sourceVersionNumber ?? null, sectionPathSnapshot: it.sectionPathSnapshot || null, order: o++ } });
  }
}

async function createRun(projectId: string, b: any, u: U) {
  const by = u.name || u.email || u.id;
  const gid = await nextGlobalId(projectId, 'TR');
  const run = await prisma.qaTestRun.create({ data: { globalId: gid, projectId, testPlanId: b.testPlanId || null, title: b.title || 'Test Run', description: b.description || null, status: 'Draft', source: b.source || 'Manual', createdBy: by, updatedBy: by } });
  // build items from test plan (snapshot test cases/checklists into run items)
  let sources: Array<{ type: string; id: string }> = [];
  if (b.testPlanId) {
    const items = await prisma.qaTestPlanItem.findMany({ where: { testPlanId: b.testPlanId, isDeleted: false }, orderBy: { order: 'asc' } });
    sources = items.map((i) => ({ type: i.sourceType, id: i.sourceId }));
  } else if (Array.isArray(b.items)) sources = b.items.map((i: any) => ({ type: i.sourceType || 'TestCase', id: i.sourceId }));
  for (const s of sources) {
    let title = ''; let steps: any = null; let ver = 1;
    if (s.type === 'TestCase') { const tc = await prisma.qaTestCase.findUnique({ where: { id: s.id } }); if (!tc) continue; title = tc.title; ver = tc.currentVersionNumber; steps = await prisma.qaTestStep.findMany({ where: { testCaseId: tc.id, isDeleted: false }, orderBy: { order: 'asc' }, select: { id: true, order: true, action: true, expectedResult: true } }); }
    else if (s.type === 'Checklist') { const cl = await prisma.qaChecklist.findUnique({ where: { id: s.id } }); if (!cl) continue; title = cl.title; ver = cl.currentVersionNumber; steps = await prisma.qaChecklistItem.findMany({ where: { checklistId: cl.id, isDeleted: false }, orderBy: { order: 'asc' }, select: { id: true, order: true, title: true } }); }
    const igid = await nextGlobalId(projectId, 'TRI');
    await prisma.qaTestRunItem.create({ data: { globalId: igid, projectId, testRunId: run.id, sourceType: s.type, sourceId: s.id, sourceVersionNumber: ver, titleSnapshot: title, stepsSnapshot: steps as any, status: 'NotRun' } });
  }
  return run;
}

async function applyResult(runId: string, itemId: string, b: any, u: U, defaultSource: string) {
  const by = u.name || u.email || u.id;
  const item = await prisma.qaTestRunItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('item not found');
  const resultSource = b.resultSource || defaultSource;
  const data: any = { status: b.status || item.status, resultSource, comment: b.comment ?? item.comment, failureMessage: b.failureMessage ?? null, stackTrace: b.stackTrace ?? null, durationMs: b.durationMs ?? item.durationMs, executedAt: new Date(), executedBy: resultSource === 'Manual' ? by : (b.executedBy || 'automation'), finishedAt: new Date() };
  if (b.startedAt) data.startedAt = new Date(b.startedAt);
  const updated = await prisma.qaTestRunItem.update({ where: { id: itemId }, data });
  await prisma.qaTestRunEvent.create({ data: { projectId: item.projectId, testRunId: runId, testRunItemId: itemId, eventType: 'TestFinished', payloadJson: { status: data.status } as any } }).catch(() => {});
  return updated;
}

// reporter/bulk result: match run item by externalTestId or sourceId, optionally create automated test
async function resultByExternalOrItem(runId: string, b: any, u: U) {
  let item = null as any;
  if (b.itemId) item = await prisma.qaTestRunItem.findUnique({ where: { id: b.itemId } });
  if (!item && b.externalTestId) {
    item = await prisma.qaTestRunItem.findFirst({ where: { testRunId: runId, externalTestId: b.externalTestId } });
    if (!item) {
      // attach to an item whose linked automated test matches, else create a standalone automated item
      const run = await prisma.qaTestRun.findUnique({ where: { id: runId } });
      if (run) {
        const at = await atUpsert(run.projectId, { externalId: b.externalTestId, name: b.name || b.externalTestId, framework: b.framework }, u, true);
        const igid = await nextGlobalId(run.projectId, 'TRI');
        item = await prisma.qaTestRunItem.create({ data: { globalId: igid, projectId: run.projectId, testRunId: runId, sourceType: 'TestCase', sourceId: at.id, titleSnapshot: at.name, externalTestId: b.externalTestId, linkedAutomatedTestId: at.id, status: 'NotRun', resultSource: 'Automated' } });
      }
    }
  }
  if (!item) return null;
  return applyResult(runId, item.id, b, u, 'Automated');
}

async function ingestEvent(runId: string, e: any) {
  const run = await prisma.qaTestRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error('run not found');
  if (e.eventId) { const dup = await prisma.qaTestRunEvent.findFirst({ where: { eventId: e.eventId } }); if (dup) return { ignored: true, reason: 'duplicate eventId' }; }
  await prisma.qaTestRunEvent.create({ data: { projectId: run.projectId, testRunId: runId, testRunItemId: e.testRunItemId || null, eventType: e.eventType || 'Heartbeat', payloadJson: e.payload || e.payloadJson || null, eventId: e.eventId || null } });
  // live state transitions
  if (e.eventType === 'TestStarted' && e.externalTestId) {
    let item = await prisma.qaTestRunItem.findFirst({ where: { testRunId: runId, externalTestId: e.externalTestId } });
    if (!item) { const at = await atUpsert(run.projectId, { externalId: e.externalTestId, name: e.name || e.externalTestId, framework: e.framework }, { id: 'system', name: 'reporter' }, true); const igid = await nextGlobalId(run.projectId, 'TRI'); item = await prisma.qaTestRunItem.create({ data: { globalId: igid, projectId: run.projectId, testRunId: runId, sourceType: 'TestCase', sourceId: at.id, titleSnapshot: at.name, externalTestId: e.externalTestId, linkedAutomatedTestId: at.id, status: 'Running', resultSource: 'Automated', startedAt: new Date(), lastHeartbeatAt: new Date(), timeoutMs: e.timeoutMs || null } }); }
    else await prisma.qaTestRunItem.update({ where: { id: item.id }, data: { status: 'Running', startedAt: new Date(), lastHeartbeatAt: new Date() } });
  } else if (e.eventType === 'TestFinished' && e.externalTestId) {
    const item = await prisma.qaTestRunItem.findFirst({ where: { testRunId: runId, externalTestId: e.externalTestId } });
    if (item) await prisma.qaTestRunItem.update({ where: { id: item.id }, data: { status: e.status || 'Passed', finishedAt: new Date(), durationMs: e.durationMs ?? item.durationMs, failureMessage: e.failureMessage || null, hangingStatus: 'Normal' } });
  } else if (e.eventType === 'Heartbeat' && e.externalTestId) {
    await prisma.qaTestRunItem.updateMany({ where: { testRunId: runId, externalTestId: e.externalTestId }, data: { lastHeartbeatAt: new Date() } });
  }
  return { ok: true };
}
