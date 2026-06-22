import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { prisma } from './db.js';
import { config } from './config.js';
import { loadPipelineSpec, stageRoleOrSkill, pipelineToMermaid } from './pipeline.js';
import { listAgents } from './agentRegistry.js';
import { createDocgenRun, getDocgenTaskView } from './docgen.js';
import { hydrateIssue, searchAiTodos, addComment } from './youtrack.js';
import { wfCreateTask, wfEnqueueJob, wfSetStatus } from './workflow.js';
import { readRecentEvents } from './bus/sink.js';
import { registerIntakeApi } from './intake.js';
import { registerKnowledgeApi, seedKnowledgeGraph } from './knowledge.js';
import { registerIdeasApi } from './ideas.js';
import { registerQualityApi } from './quality.js';
import { registerBugsApi } from './bugs.js';
import { registerPreplanningApi } from './preplanning.js';
import { registerTasksApi } from './tasks.js';
import { registerTestingApi } from './testing.js';
import { registerUsageApi } from './usage.js';
import { registerAnswersApi } from './answers.js';
import { registerVersionApi } from './version.js';
import { loadGraphIntoDb } from './graphLoader.js';
import { ensureBucket } from './storage.js';
import { registerAuthApi, seedDefaultAdmin } from './auth.js';
import { TaskStatus, WfJobType, WfTaskStatus } from './prismaEnums.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true });

app.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// multipart for voice intake uploads
app.register(fastifyMultipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

await registerAuthApi(app);
await registerIntakeApi(app);
await registerKnowledgeApi(app);
await registerIdeasApi(app);
await registerQualityApi(app);
await registerBugsApi(app);
await registerPreplanningApi(app);
await registerTasksApi(app);
await registerTestingApi(app);
await registerUsageApi(app);
await registerAnswersApi(app);
await registerVersionApi(app);

const createTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  role: z.string().min(1).max(120),
  prompt: z.string().min(1),
  callbackUrl: z.string().url().optional(),
});

const createRunSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  pipelineId: z.string().min(1).max(200).default('qa-core-mvp'),
  pipelinePath: z.string().min(1).optional(),
  inputText: z.string().min(1),
  externalRef: z.string().min(1).optional(),
  createdBy: z.string().min(1).max(120).optional(),
});

app.get('/health', async () => ({ ok: true }));

app.get('/api/limits', async () => {
  return {
    used: 0,
    total: 1000000,
    placeholder: true,
    note: 'MVP placeholder. Real provider limits will be added later.',
  };
});

// --- Activity stream (WS1/WS2) ---
app.get('/api/events', async (req: any) => {
  const limit = Math.min(Number(req.query?.limit || 200), 2000);
  const events = readRecentEvents(limit);
  return { events };
});

app.post('/api/tasks', async (req, reply) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      role: parsed.data.role,
      prompt: parsed.data.prompt,
      callbackUrl: parsed.data.callbackUrl,
      status: TaskStatus.PENDING,
    },
  });

  return reply.code(201).send(task);
});

app.get('/api/tasks', async (req: any) => {
  const limit = Math.min(Number(req.query?.limit || 50), 200);
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return { tasks };
});

// --- Workflow Orchestrator v1 API (TZ 2026-04-28) ---
const wfCreateTaskSchema = z.object({
  externalSource: z.string().min(1).optional(),
  externalTaskId: z.string().min(1).optional(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  projectId: z.string().min(1).optional(),
  repositoryId: z.string().min(1).optional(),
  reporterId: z.string().min(1).optional(),
  assigneeId: z.string().min(1).optional(),
  taskType: z.string().min(1).optional(),
  priority: z.string().min(1).optional(),
  deadlineAt: z.string().datetime().optional(),
  autoAnalyze: z.boolean().default(true),
});

app.post('/api/wf/tasks', async (req, reply) => {
  const parsed = wfCreateTaskSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

  const task = await wfCreateTask({
    externalSource: parsed.data.externalSource,
    externalTaskId: parsed.data.externalTaskId,
    title: parsed.data.title,
    description: parsed.data.description,
    projectId: parsed.data.projectId,
    repositoryId: parsed.data.repositoryId,
    reporterId: parsed.data.reporterId,
    assigneeId: parsed.data.assigneeId,
    taskType: parsed.data.taskType,
    priority: parsed.data.priority,
    deadlineAt: parsed.data.deadlineAt ? new Date(parsed.data.deadlineAt) : undefined,
  });

  if (parsed.data.autoAnalyze) {
    await wfEnqueueJob(task.id, WfJobType.ANALYZE_TASK, { reason: 'autoAnalyze' });
    await wfSetStatus(task.id, WfTaskStatus.ANALYZING);
  }

  return reply.code(201).send({ taskId: task.id });
});

app.get('/api/wf/tasks', async (req: any) => {
  const limit = Math.min(Number(req.query?.limit || 50), 200);
  const status = req.query?.status ? String(req.query.status) : undefined;

  const tasks = await prisma.wfTask.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      questions: { where: { status: { in: ['OPEN'] as any } } },
    },
  });

  return {
    tasks: tasks.map((t: any) => ({
      id: t.id,
      externalSource: t.externalSource,
      externalTaskId: t.externalTaskId,
      title: t.title,
      status: t.status,
      openQuestions: t.questions.length,
      nextPingAt: t.nextPingAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  };
});

app.get('/api/wf/tasks/:id', async (req: any, reply) => {
  const task = await prisma.wfTask.findUnique({
    where: { id: req.params.id },
    include: {
      questions: { orderBy: { createdAt: 'asc' }, include: { answers: { orderBy: { createdAt: 'asc' } } } },
      answers: { orderBy: { createdAt: 'asc' } },
      events: { orderBy: { createdAt: 'asc' } },
      jobs: { orderBy: { createdAt: 'desc' }, take: 50 },
      gitChanges: { orderBy: { createdAt: 'desc' }, take: 20 },
      aiRuns: { orderBy: { startedAt: 'desc' }, take: 20 },
    },
  });
  if (!task) return reply.code(404).send({ error: 'Task not found' });

  const openQuestions = task.questions.filter((q: any) => q.status === 'OPEN').length;

  return {
    id: task.id,
    externalSource: task.externalSource,
    externalTaskId: task.externalTaskId,
    title: task.title,
    description: task.description,
    status: task.status,
    openQuestions,
    nextPingAt: task.nextPingAt,
    pingCount: task.pingCount,
    deadlineAt: task.deadlineAt,
    blockedReason: task.blockedReason,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    questions: task.questions,
    answers: task.answers,
    events: task.events,
    jobs: task.jobs,
    gitChanges: task.gitChanges,
    aiRuns: task.aiRuns,
  };
});

const wfAddAnswerSchema = z.object({
  questionId: z.string().min(1).optional(),
  authorId: z.string().min(1).optional(),
  answer: z.string().min(1),
  source: z.string().min(1).optional(),
});

app.post('/api/wf/tasks/:id/answers', async (req: any, reply) => {
  const parsed = wfAddAnswerSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

  const task = await prisma.wfTask.findUnique({ where: { id: req.params.id } });
  if (!task) return reply.code(404).send({ error: 'Task not found' });

  const ans = await prisma.wfTaskAnswer.create({
    data: {
      taskId: task.id,
      questionId: parsed.data.questionId,
      authorId: parsed.data.authorId,
      answerText: parsed.data.answer,
      source: parsed.data.source,
    },
  });

  // Mark question answered if provided
  if (parsed.data.questionId) {
    await prisma.wfTaskQuestion.update({
      where: { id: parsed.data.questionId },
      data: { status: 'ANSWERED' as any, answeredAt: new Date() },
    });
  }

  await prisma.wfTaskEvent.create({
    data: {
      taskId: task.id,
      eventType: 'ANSWER_RECEIVED' as any,
      actorType: 'human',
      actorId: parsed.data.authorId,
      payload: { questionId: parsed.data.questionId, source: parsed.data.source },
    },
  });

  // Re-analyze
  await wfSetStatus(task.id, WfTaskStatus.CLARIFICATION_RECEIVED);
  await wfEnqueueJob(task.id, WfJobType.REANALYZE_TASK, { reason: 'answerReceived', answerId: ans.id });

  return reply.code(201).send({ answerId: ans.id });
});

app.post('/api/wf/tasks/:id/execute', async (req: any, reply) => {
  const task = await prisma.wfTask.findUnique({ where: { id: req.params.id } });
  if (!task) return reply.code(404).send({ error: 'Task not found' });

  await wfSetStatus(task.id, WfTaskStatus.READY_FOR_EXECUTION);
  await wfEnqueueJob(task.id, WfJobType.EXECUTE_TASK, { requestedBy: 'api' });
  return reply.code(202).send({ ok: true });
});

// --- Pipeline runs (multi-agent) ---
app.post('/api/runs', async (req, reply) => {
  const parsed = createRunSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const pipelinePath = parsed.data.pipelinePath || 'core/orchestration/pipeline.v1.yaml';
  const spec = loadPipelineSpec(pipelinePath);

  const run = await prisma.pipelineRun.create({
    data: {
      title: parsed.data.title,
      pipelineId: parsed.data.pipelineId || spec.name,
      inputText: parsed.data.inputText,
      externalRef: parsed.data.externalRef,
      createdBy: parsed.data.createdBy,
      status: 'PENDING',
      stages: {
        create: spec.stages.map((s) => ({
          stageId: s.id,
          stageName: s.id,
          roleOrSkill: stageRoleOrSkill(s),
          dependsOn: s.depends_on || [],
          status: 'PENDING',
        })),
      },
    },
    include: { stages: true },
  });

  return reply.code(201).send(run);
});

app.get('/api/runs', async (req: any) => {
  const limit = Math.min(Number(req.query?.limit || 50), 200);
  const runs = await prisma.pipelineRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { stages: true },
  });
  return { runs };
});

app.get('/api/runs/:id', async (req: any, reply) => {
  const run = await prisma.pipelineRun.findUnique({
    where: { id: req.params.id },
    include: { stages: true, artifacts: { orderBy: { createdAt: 'asc' } } },
  });
  if (!run) return reply.code(404).send({ error: 'Run not found' });
  return run;
});

app.post('/api/runs/:id/start', async (req: any, reply) => {
  const run = await prisma.pipelineRun.findUnique({ where: { id: req.params.id }, include: { stages: true } });
  if (!run) return reply.code(404).send({ error: 'Run not found' });

  if (run.status !== 'PENDING') return reply.code(409).send({ error: `Run status is ${run.status}` });

  const updated = await prisma.pipelineRun.update({
    where: { id: run.id },
    data: { status: 'RUNNING', startedAt: new Date() },
    include: { stages: true },
  });

  return updated;
});

// --- Admin-ish controls (MVP; no auth yet) ---
app.post('/api/runs/:id/retry', async (req: any, reply) => {
  const run = await prisma.pipelineRun.findUnique({ where: { id: req.params.id }, include: { stages: true } });
  if (!run) return reply.code(404).send({ error: 'Run not found' });

  // reset all stages
  await prisma.stageRun.updateMany({
    where: { runId: run.id },
    data: {
      status: 'PENDING',
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
      resultText: null,
      promptText: null,
      model: null,
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    },
  });

  const updated = await prisma.pipelineRun.update({
    where: { id: run.id },
    data: { status: 'RUNNING', startedAt: new Date(), finishedAt: null, errorMessage: null, resultText: null },
    include: { stages: true },
  });

  return reply.send({ ok: true, run: updated });
});

app.post('/api/stages/:stageRunId/retry', async (req: any, reply) => {
  const s = await prisma.stageRun.findUnique({ where: { id: String(req.params.stageRunId) } });
  if (!s) return reply.code(404).send({ error: 'StageRun not found' });

  // reset only this stage
  const updatedStage = await prisma.stageRun.update({
    where: { id: s.id },
    data: {
      status: 'PENDING',
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
      resultText: null,
      promptText: null,
      model: null,
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    },
  });

  // ensure run is RUNNING
  await prisma.pipelineRun.update({ where: { id: s.runId }, data: { status: 'RUNNING', finishedAt: null, errorMessage: null } });

  return reply.send({ ok: true, stage: updatedStage });
});

app.post('/api/stages/:stageRunId/skip', async (req: any, reply) => {
  const s = await prisma.stageRun.findUnique({ where: { id: String(req.params.stageRunId) } });
  if (!s) return reply.code(404).send({ error: 'StageRun not found' });

  const updatedStage = await prisma.stageRun.update({
    where: { id: s.id },
    data: {
      status: 'SKIPPED',
      startedAt: s.startedAt ?? new Date(),
      finishedAt: new Date(),
      errorMessage: null,
    },
  });

  await prisma.pipelineRun.update({ where: { id: s.runId }, data: { status: 'RUNNING', finishedAt: null, errorMessage: null } });

  return reply.send({ ok: true, stage: updatedStage });
});

const adhocSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  roleOrSkill: z.string().min(1).max(200),
  prompt: z.string().min(1),
  createdBy: z.string().min(1).max(120).optional(),
});

// B: ad-hoc agent run (1-stage pipeline run)
app.post('/api/adhoc', async (req: any, reply) => {
  const parsed = adhocSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

  const run = await prisma.pipelineRun.create({
    data: {
      title: parsed.data.title ?? `ad-hoc: ${parsed.data.roleOrSkill}`,
      pipelineId: 'adhoc',
      inputText: parsed.data.prompt,
      createdBy: parsed.data.createdBy,
      status: 'RUNNING',
      startedAt: new Date(),
      stages: {
        create: [
          {
            stageId: 'adhoc',
            stageName: 'adhoc',
            roleOrSkill: parsed.data.roleOrSkill,
            dependsOn: [],
            status: 'PENDING',
          },
        ],
      },
    },
    include: { stages: true },
  });

  return reply.code(201).send(run);
});

// --- Pipeline specs & graph ---
app.get('/api/pipelines', async () => {
  // For now, static list. Can become dynamic registry.
  return {
    pipelines: [
      {
        id: 'qa-core-mvp',
        path: 'core/orchestration/pipeline.v1.yaml',
      },
      {
        id: 'docgen-v1',
        path: 'core/orchestration/docgen.pipeline.v1.yaml',
      },
    ],
  };
});

app.get('/api/pipelines/graph', async (req: any, reply) => {
  const pipelinePath = String(req.query?.pipelinePath || 'core/orchestration/pipeline.v1.yaml');
  const spec = loadPipelineSpec(pipelinePath);
  const mermaid = pipelineToMermaid(spec);
  return reply.type('text/plain').send(mermaid);
});

// Mermaid graph for a конкретный run with stage statuses
app.get('/api/runs/:id/graph', async (req: any, reply) => {
  const run = await prisma.pipelineRun.findUnique({
    where: { id: req.params.id },
    include: { stages: true },
  });
  if (!run) return reply.code(404).send({ error: 'Run not found' });

  const pipelinePath = 'core/orchestration/pipeline.v1.yaml';
  const spec = loadPipelineSpec(pipelinePath);

  const stageStatus: Record<string, string> = {};
  const stageTokens: Record<string, number> = {};
  for (const s of run.stages) {
    stageStatus[s.stageId] = s.status;
    if (typeof s.totalTokens === 'number') stageTokens[s.stageId] = s.totalTokens;
  }

  const mermaid = pipelineToMermaid(spec, { stageStatus, stageTokens });
  return reply.type('text/plain').send(mermaid);
});

// --- Agents registry (skills/*) ---
app.get('/api/agents', async (req: any) => {
  const team = req.query?.team ? String(req.query.team) : undefined;
  const agents = listAgents();
  const filtered = team ? agents.filter((a) => a.team === team) : agents;
  return {
    agents: filtered.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      team: a.team,
      teamTitle: a.teamTitle,
      maturity: a.maturity,
      type: a.type,
      outputs: a.outputs,
      humanReviewRequired: a.humanReviewRequired,
    })),
  };
});

app.get('/api/agents/:id', async (req: any, reply) => {
  const id = String(req.params.id);
  const agents = listAgents();
  const a = agents.find((x) => x.id === id);
  if (!a) return reply.code(404).send({ error: 'Agent not found' });
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    team: a.team,
    teamTitle: a.teamTitle,
    maturity: a.maturity,
    type: a.type,
    outputs: a.outputs,
    humanReviewRequired: a.humanReviewRequired,
    skillMarkdown: a.skillMarkdown,
  };
});

// Activity / assignment view (who is busy on what)
app.get('/api/agents/activity', async (req: any) => {
  const limit = Math.min(Number(req.query?.limit || 50), 200);
  const stageLimit = Math.min(Number(req.query?.stageLimit || 10), 50);

  const agents = listAgents();

  const activeStages = await prisma.stageRun.findMany({
    where: { status: { in: ['PENDING', 'RUNNING'] } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 2000,
    select: {
      id: true,
      runId: true,
      stageId: true,
      stageName: true,
      roleOrSkill: true,
      status: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });

  const runIds = Array.from(new Set(activeStages.map((s: any) => s.runId)));
  const runs = await prisma.pipelineRun.findMany({
    where: { id: { in: runIds } },
    select: { id: true, title: true, externalRef: true, createdBy: true, createdAt: true },
  });
  const runMap = new Map<string, any>(runs.map((r: any) => [r.id, r]));

  const activeByAgent = new Map<string, any[]>();
  for (const s of activeStages) {
    const key = s.roleOrSkill;
    const r = runMap.get(s.runId);
    const item = {
      stageRunId: s.id,
      runId: s.runId,
      runTitle: r?.title,
      externalRef: r?.externalRef,
      createdBy: r?.createdBy,
      runCreatedAt: r?.createdAt,
      stageId: s.stageId,
      stageName: s.stageName,
      status: s.status,
      stageCreatedAt: s.createdAt,
      stageStartedAt: s.startedAt,
    };
    const arr = activeByAgent.get(key) || [];
    arr.push(item);
    activeByAgent.set(key, arr);
  }

  const result = agents
    .map((a) => {
      const active = (activeByAgent.get(a.id) || []).slice(0, stageLimit);
      const runningCount = (activeByAgent.get(a.id) || []).filter((x) => x.status === 'RUNNING').length;
      const pendingCount = (activeByAgent.get(a.id) || []).filter((x) => x.status === 'PENDING').length;
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        team: a.team,
        teamTitle: a.teamTitle,
        type: a.type,
        maturity: a.maturity,
        outputs: a.outputs,
        humanReviewRequired: a.humanReviewRequired,
        counts: { running: runningCount, pending: pendingCount },
        active,
      };
    })
    .sort((x, y) => (y.counts.running + y.counts.pending) - (x.counts.running + x.counts.pending))
    .slice(0, limit);

  return { agents: result };
});

app.get('/api/tasks/:id', async (req: any, reply) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return reply.code(404).send({ error: 'Task not found' });
  return task;
});

// ---- DOCGEN bridge (pipeline run exposed as task-like API) ----
app.post('/api/docgen/tasks', async (req: any, reply) => {
  const body: any = req.body || {};
  const filePath = String(body.filePath || body.targetPath || body.path || '').trim();
  const mode = body.mode === 'update' ? 'update' : 'create';
  const links = Array.isArray(body.links)
    ? body.links
    : String(body.links || '')
        .split(/\s*[\n,]+\s*/)
        .map((v) => v.trim())
        .filter(Boolean);
  const comment = String(body.comment || '').trim();
  const createdBy = String(body.createdBy || body.user || '').trim() || undefined;
  const externalRef = String(body.externalRef || '').trim() || undefined;

  if (!filePath) return reply.code(400).send({ error: 'filePath is required' });

  const run = await createDocgenRun({
    title: body.title ? String(body.title) : undefined,
    filePath,
    mode,
    comment,
    links,
    createdBy,
    externalRef,
  });

  // Auto-start immediately
  await prisma.pipelineRun.update({ where: { id: run.id }, data: { status: 'RUNNING', startedAt: new Date() } });

  return reply.code(201).send({
    id: run.id,
    status: 'RUNNING',
    kind: 'docgen_pipeline',
    pipelineId: run.pipelineId,
    createdAt: run.createdAt,
  });
});

app.get('/api/docgen/tasks/:id', async (req: any, reply) => {
  const task = await getDocgenTaskView(String(req.params.id));
  if (!task) return reply.code(404).send({ error: 'Task not found' });
  return task;
});

app.get('/api/tasks/:id/wait', async (req: any, reply) => {
  const timeoutMs = Math.min(Number(req.query?.timeoutMs || 30000), 120000);
  const pollMs = Math.min(Number(req.query?.pollMs || 500), 5000);
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return reply.code(404).send({ error: 'Task not found' });
    if (task.status === TaskStatus.DONE || task.status === TaskStatus.FAILED) return task;
    await new Promise((r) => setTimeout(r, pollMs));
  }

  return reply.code(202).send({ status: 'TIMEOUT', note: 'Task still running. Call again or use callbackUrl.' });
});

// ---- YouTrack integration ----
function assertWebhookSecret(req: any) {
  const expected = String(config.youtrack.webhookSecret || '').trim();
  if (!expected) return;
  const got = String(req.headers['x-youtrack-token'] || req.headers['x-webhook-secret'] || '').trim();
  if (!got || got !== expected) {
    const err: any = new Error('Invalid webhook secret');
    err.statusCode = 401;
    throw err;
  }
}

async function handleYouTrackIssue(issueIdOrReadable: string, trigger: string) {
  const issue = await hydrateIssue(issueIdOrReadable);
  const state = String(issue.state || '').trim();

  const triggerState = String(process.env.YOUTRACK_TRIGGER_STATE || 'In Progress').trim();
  if (state !== triggerState) {
    return { skipped: true, reason: `State is ${state} (expected ${triggerState})` };
  }
  if (!issue.summary.startsWith('[AI]')) {
    return { skipped: true, reason: 'Summary does not start with [AI]' };
  }

  const externalRef = `youtrack:${issue.idReadable}`;
  const existing = await prisma.pipelineRun.findFirst({
    where: { externalRef, status: { in: ['PENDING', 'RUNNING', 'DONE'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    return { skipped: true, reason: `Run already exists: ${existing.id}`, runId: existing.id };
  }

  const inputText = [
    `YouTrack Issue: ${issue.idReadable}`,
    `Trigger: ${trigger}`,
    `Summary: ${issue.summary}`,
    `Description:\n${issue.description || ''}`,
    issue.links.length ? `\nLinked issues:\n${issue.links.map((l) => `- ${l.direction || ''} ${l.type || ''}: ${l.idReadable || ''} ${l.summary || ''}`.trim()).join('\n')}` : '',
    issue.comments.length ? `\nComments:\n${issue.comments.slice(-20).map((c) => `- ${c.author} (${new Date(c.created).toISOString()}): ${c.text}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');

  // Create a pipeline run for execution.
  // Default pipeline can be overridden via env.
  const pipelinePath = String(process.env.YOUTRACK_PIPELINE_PATH || 'core/orchestration/pipeline.v1.yaml').trim();

  const run = await prisma.pipelineRun.create({
    data: {
      title: issue.summary,
      pipelineId: 'youtrack-trigger',
      inputText,
      externalRef,
      createdBy: 'youtrack',
      status: 'RUNNING',
      startedAt: new Date(),
      stages: {
        create: loadPipelineSpec(pipelinePath).stages.map((s) => ({
          stageId: s.id,
          stageName: s.id,
          roleOrSkill: stageRoleOrSkill(s),
          dependsOn: s.depends_on || [],
          status: 'PENDING',
        })),
      },
      artifacts: {
        create: [
          {
            kind: 'youtrack_issue_snapshot',
            name: `${issue.idReadable}.json`,
            contentType: 'application/json',
            text: JSON.stringify(issue, null, 2),
          },
        ],
      },
    },
    include: { stages: true },
  });

  await addComment(issue.id, `Picked up by orchestrator (${trigger}). Run: ${run.id}`);

  return { ok: true, runId: run.id, issueId: issue.idReadable };
}

app.post('/api/youtrack/webhook', async (req: any, reply) => {
  try {
    if (!config.youtrack.enabled) return reply.code(503).send({ ok: false, disabled: true });
    assertWebhookSecret(req);
    const body: any = req.body || {};
    const issueId = String(body?.issue?.id || body?.issue?.idReadable || body?.issueId || body?.id || '').trim();
    if (!issueId) return reply.code(400).send({ error: 'issueId is required in webhook payload' });
    const result = await handleYouTrackIssue(issueId, 'webhook');
    return reply.send({ ok: true, result });
  } catch (e: any) {
    return reply.code(e.statusCode || 500).send({ ok: false, error: e.message });
  }
});

app.post('/api/youtrack/poll', async (req: any, reply) => {
  try {
    if (!config.youtrack.enabled) return reply.code(204).send();
    const found = await searchAiTodos();
    const issues = Array.isArray(found) ? found : [];
    const results = [];
    for (const it of issues.slice(0, 20)) {
      const issueId = String(it?.id || it?.idReadable || '').trim();
      if (!issueId) continue;
      results.push({ issueId, ...(await handleYouTrackIssue(issueId, 'poll')) });
    }
    return reply.send({ ok: true, count: results.length, results });
  } catch (e: any) {
    return reply.code(e.statusCode || 500).send({ ok: false, error: e.message });
  }
});

// --- Page routes ---
// Knowledge Assistant (Google-style) is the primary product at `/`.
app.get('/', async (_, reply) => {
  return reply.sendFile('index.html');
});

// SPA handles the login view; deep-link friendly.
app.get('/login', async (_, reply) => {
  return reply.sendFile('index.html');
});

// Admin console (access enforced by the admin APIs it calls).
app.get('/admin', async (_, reply) => {
  return reply.sendFile('admin.html');
});

// Knowledge graph + traceability visualization.
app.get('/graph', async (_, reply) => {
  return reply.sendFile('graph.html');
});

// Improvement ideas (user submissions + admin review/implement).
app.get('/ideas', async (_, reply) => {
  return reply.sendFile('ideas.html');
});

// Quality Coverage Analytics (Treemap / Matrix / Dependency graph).
app.get('/quality', async (_, reply) => {
  return reply.sendFile('quality.html');
});

// Bugs — LLM-assisted defect intake → Jira.
app.get('/bugs', async (_, reply) => {
  return reply.sendFile('bugs.html');
});

// AI Pre-planning — grounded sprint pre-planning → Jira (human-gated).
app.get('/pre-planning', async (_, reply) => {
  return reply.sendFile('pre-planning.html');
});

// New tasks — clarifying-dialogue → structured spec → Jira task.
app.get('/tasks', async (_, reply) => {
  return reply.sendFile('tasks.html');
});

// Task testing — Jira + GitLab branch code → static-testing report.
app.get('/testing', async (_, reply) => {
  return reply.sendFile('testing.html');
});

// Legacy internal orchestrator dashboard (engineering use).
app.get('/internal', async (_, reply) => {
  return reply.sendFile('internal.html');
});

async function start() {
  await seedDefaultAdmin().catch((e) => app.log.error(e, 'admin seed failed'));
  // Load the real documentation knowledge graph (idempotent, self-deploying);
  // fall back to the small stub seed only when graph.json is absent.
  await loadGraphIntoDb((m) => app.log.info(m))
    .then((res) => { if (res.missing) return seedKnowledgeGraph(); })
    .catch((e) => app.log.error(e, 'graph load failed'));
  await ensureBucket((m) => app.log.info(m)).catch((e) => app.log.error(e, 'storage init failed'));
  await app.listen({ host: '0.0.0.0', port: config.port });
  app.log.info(`app listening on :${config.port}`);
}

start().catch((e) => {
  app.log.error(e);
  process.exit(1);
});
