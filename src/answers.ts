import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './db.js';
import { requireAuth } from './auth.js';

// ---------------------------------------------------------------------------
// Saved feature answers (Testing / Bugs). Lets a finished answer be reopened
// from a request history and shared by link (/testing?id=… , /bugs?id=…).
// An answer is owned by its author, but any authenticated user can open it by
// id (so a link can be sent to a colleague). Tasks use TaskDraft instead.
// ---------------------------------------------------------------------------
const FEATURES = ['testing', 'bugs', 'testing-task'] as const;

export async function registerAnswersApi(app: FastifyInstance) {
  const saveSchema = z.object({
    feature: z.enum(FEATURES),
    ref: z.string().max(250).optional(),
    title: z.string().max(250).optional(),
    data: z.any(),
  });

  // Persist an answer; returns its id (used to build a shareable link).
  app.post('/api/answers', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const d = parsed.data;
    try {
      const row = await prisma.featureAnswer.create({
        data: { userId: user.id, userLabel: user.name, feature: d.feature, ref: (d.ref || '').slice(0, 250) || null, title: (d.title || '').slice(0, 250), data: d.data ?? {} },
      });
      return reply.send({ id: row.id });
    } catch (e: any) {
      return reply.code(500).send({ error: String(e?.message || e).slice(0, 200) });
    }
  });

  // List the current user's saved answers for a feature (history drawer).
  app.get('/api/answers', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const feature = String(req.query?.feature || '');
    if (!FEATURES.includes(feature as any)) return reply.code(400).send({ error: 'bad feature' });
    const rows = await prisma.featureAnswer.findMany({
      where: { userId: user.id, feature }, orderBy: { createdAt: 'desc' }, take: 100,
      select: { id: true, ref: true, title: true, createdAt: true },
    });
    return reply.send({ items: rows });
  });

  // Fetch a full saved answer by id — any authenticated user (shareable link).
  app.get('/api/answers/:id', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const row = await prisma.featureAnswer.findUnique({ where: { id: String(req.params.id) } });
    if (!row) return reply.code(404).send({ error: 'not found' });
    return reply.send({ answer: row });
  });

  // Delete a saved answer — owner only.
  app.delete('/api/answers/:id', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const row = await prisma.featureAnswer.findUnique({ where: { id: String(req.params.id) } });
    if (!row || row.userId !== user.id) return reply.code(404).send({ error: 'not found' });
    await prisma.featureAnswer.delete({ where: { id: row.id } });
    return reply.send({ ok: true });
  });
}
