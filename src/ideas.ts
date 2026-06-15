import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './db.js';
import { requireAuth, requireAdmin } from './auth.js';

// Папка с git-репозиторием деплоя, смонтированная в контейнер (см. docker-compose).
const WORKSPACE = process.env.IMPL_WORKSPACE || '/workspace';
const COMPOSE_PROJECT = process.env.COMPOSE_PROJECT || 'shiptify-orchestrator';

// Запускаем агент/git от uid 1000 (node) — совпадает с владельцем смонтированного
// репо (нет git "dubious ownership") и снимает запрет Claude на bypass под root.
const RUN_UID = Number(process.env.IMPL_UID || 1000);
const RUN_GID = Number(process.env.IMPL_GID || 1000);
const RUN_HOME = process.env.IMPL_HOME || '/home/node';

function sh(cmd: string, args: string[], opts: { cwd?: string; timeoutMs?: number; asUser?: boolean } = {}): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...(opts.asUser ? { uid: RUN_UID, gid: RUN_GID, env: { ...process.env, HOME: RUN_HOME } } : {}),
    });
    let out = '';
    const cap = (b: Buffer) => { out += b.toString(); if (out.length > 60000) out = out.slice(-60000); };
    proc.stdout.on('data', cap);
    proc.stderr.on('data', cap);
    const timer = opts.timeoutMs ? setTimeout(() => proc.kill('SIGKILL'), opts.timeoutMs) : null;
    proc.on('close', (code) => { if (timer) clearTimeout(timer); resolve({ code: code ?? -1, out }); });
    proc.on('error', (e) => { if (timer) clearTimeout(timer); resolve({ code: -1, out: out + '\n' + e.message }); });
  });
}

async function setIdea(id: string, data: any) {
  try { await prisma.idea.update({ where: { id }, data }); } catch { /* ignore */ }
}

// Автономная реализация идеи: агент Claude правит код в смонтированном репо,
// затем commit → push → пересборка/рестарт прод-контейнера (detached, чтобы
// перезапуск приложения не оборвал джобу до записи статуса).
async function runImplement(ideaId: string, title: string, body: string, adminName: string) {
  const log: string[] = [`[${new Date().toISOString()}] Реализация запущена (${adminName}).`];
  const flush = (extra?: string) => { if (extra) log.push(extra); return setIdea(ideaId, { log: log.join('\n').slice(-60000) }); };

  if (!fs.existsSync(path.join(WORKSPACE, '.git'))) {
    await setIdea(ideaId, { status: 'FAILED', log: log.concat(`Рабочий репозиторий не смонтирован (${WORKSPACE}/.git не найден).`).join('\n') });
    return;
  }

  const task = `Реализуй следующее улучшение продукта в этом репозитории и убедись, что код консистентен.

ЗАДАЧА: ${title}

ОПИСАНИЕ:
${body}

Требования: внеси минимальные корректные изменения по задаче; не ломай сборку; не трогай секреты/.env; если задача неясна или вне скоупа — поясни и НЕ делай вредных изменений. По завершении кратко перечисли изменённые файлы.`;

  await flush('Агент Claude работает над задачей…');
  const agent = await sh('claude', ['-p', task, '--permission-mode', 'bypassPermissions', '--model', process.env.ANSWER_MODEL || 'claude-sonnet-4-6'], { cwd: WORKSPACE, timeoutMs: 15 * 60 * 1000, asUser: true });
  log.push('--- ВЫВОД АГЕНТА ---', agent.out.slice(-20000), `--- агент завершил (код ${agent.code}) ---`);
  await flush();

  const G = ['-C', WORKSPACE, '-c', 'safe.directory=*'];
  const diff = await sh('git', [...G, 'status', '--porcelain'], { timeoutMs: 30000, asUser: true });
  if (!diff.out.trim()) {
    await setIdea(ideaId, { status: 'FAILED', log: log.concat('Агент не внёс изменений в файлы — нечего коммитить.').join('\n') });
    return;
  }
  log.push('Изменённые файлы:', diff.out.trim().slice(0, 4000));

  await sh('git', [...G, 'add', '-A'], { timeoutMs: 30000, asUser: true });
  const commitMsg = `feat(idea): ${title}\n\nAuto-implemented from idea ${ideaId} (approved by ${adminName}).\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>`;
  const commit = await sh('git', [...G, '-c', 'user.name=Ideas Bot', '-c', 'user.email=ideas@shiptify.local', 'commit', '-m', commitMsg], { timeoutMs: 30000, asUser: true });
  log.push('--- commit ---', commit.out.slice(-2000));
  const shaRes = await sh('git', [...G, 'rev-parse', '--short', 'HEAD'], { timeoutMs: 15000, asUser: true });
  const sha = shaRes.out.trim().slice(0, 12);

  const push = await sh('git', [...G, 'push'], { timeoutMs: 120000, asUser: true });
  log.push('--- push ---', push.out.slice(-2000));
  const pushed = push.code === 0;

  // Записываем статус ДО рестарта (deploy перезапустит этот контейнер).
  await setIdea(ideaId, {
    status: 'APPLIED',
    commitSha: sha,
    log: log.concat(pushed ? `Закоммичено (${sha}) и запушено. Запускаю пересборку прод…` : `Закоммичено (${sha}). PUSH НЕ УДАЛСЯ — см. лог.`).join('\n').slice(-60000),
  });

  // Редеплой в ОТДЕЛЬНОМ контейнере (нельзя пересобирать app из самого app —
  // рестарт убьёт процесс деплоя). Деплоер health-чекает и откатывается при сбое.
  const hostPath = process.env.DEPLOY_HOST_PATH || '/home/user/ka-prod-deploy';
  const appImage = process.env.APP_IMAGE || `${COMPOSE_PROJECT}-app`;
  try {
    const deploy = spawn('docker', [
      'run', '-d', '--rm',
      '-e', `COMPOSE_PROJECT=${COMPOSE_PROJECT}`,
      '-v', '/var/run/docker.sock:/var/run/docker.sock',
      '-v', `${hostPath}:/ws`,
      '-w', '/ws',
      appImage, 'sh', '/ws/scripts/idea-deploy.sh',
    ], { detached: true, stdio: 'ignore' });
    deploy.unref();
  } catch { /* деплой best-effort */ }
}

export async function registerIdeasApi(app: FastifyInstance) {
  const createSchema = z.object({ title: z.string().min(3).max(200), body: z.string().min(3).max(8000) });

  // --- Пользователь ---
  app.post('/api/ideas', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const idea = await prisma.idea.create({ data: { userId: user.id, userLabel: user.name, title: parsed.data.title, body: parsed.data.body, status: 'PENDING' } });
    return reply.code(201).send({ idea });
  });

  app.get('/api/ideas/mine', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const ideas = await prisma.idea.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 200 });
    return reply.send({ ideas });
  });

  // --- Админ ---
  app.get('/api/admin/ideas', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply); if (!admin) return;
    const ideas = await prisma.idea.findMany({ orderBy: { createdAt: 'desc' }, take: 500, include: { user: { select: { name: true, email: true } } } });
    return reply.send({ ideas });
  });

  const statusSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED', 'PENDING']) });
  app.post('/api/admin/ideas/:id/status', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply); if (!admin) return;
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const idea = await prisma.idea.update({ where: { id: req.params.id }, data: { status: parsed.data.status, reviewedById: admin.id } });
    return reply.send({ idea });
  });

  // Кнопка «Реализовать»: запускает автономного агента (фон). Только админ.
  app.post('/api/admin/ideas/:id/implement', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply); if (!admin) return;
    const idea = await prisma.idea.findUnique({ where: { id: req.params.id } });
    if (!idea) return reply.code(404).send({ error: 'not found' });
    if (idea.status === 'IN_PROGRESS') return reply.code(409).send({ error: 'уже выполняется' });
    await prisma.idea.update({ where: { id: idea.id }, data: { status: 'IN_PROGRESS', reviewedById: admin.id, log: 'В очереди…' } });
    // Запуск в фоне — не блокируем ответ.
    runImplement(idea.id, idea.title, idea.body, admin.name).catch(async (e) => {
      await setIdea(idea.id, { status: 'FAILED', log: 'Ошибка запуска: ' + (e?.message || String(e)) });
    });
    return reply.send({ ok: true, status: 'IN_PROGRESS' });
  });
}
