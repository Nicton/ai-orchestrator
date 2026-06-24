import type { FastifyInstance } from 'fastify';
import { prisma } from './db.js';
import { requireAdmin } from './auth.js';

// ---------------------------------------------------------------------------
// Feature-usage logging: every LLM operation in Bugs/Tasks/Testing/Pre-planning
// records a row with token spend, so the admin panel can show requests + tokens
// across all features (not just knowledge queries). Logging never throws.
// ---------------------------------------------------------------------------
export type FeatureName = 'bugs' | 'tasks' | 'testing' | 'preplanning' | 'develop';

export async function logFeatureUsage(rec: {
  userId?: string | null;
  userLabel?: string | null;
  feature: FeatureName;
  action?: string;
  ref?: string | null;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  status?: 'ok' | 'error';
  rating?: number | null;
  ratingNote?: string | null;
}): Promise<string | null> {
  try {
    const row = await prisma.featureUsage.create({
      data: {
        userId: rec.userId ?? null,
        userLabel: rec.userLabel ?? null,
        feature: rec.feature,
        action: rec.action ?? null,
        ref: rec.ref ? String(rec.ref).slice(0, 250) : null,
        model: rec.model ?? null,
        promptTokens: rec.promptTokens ?? null,
        completionTokens: rec.completionTokens ?? null,
        totalTokens: rec.totalTokens ?? null,
        status: rec.status ?? 'ok',
        rating: rec.rating ?? null,
        ratingNote: rec.ratingNote ? String(rec.ratingNote).slice(0, 500) : null,
      },
    });
    return row.id;
  } catch { return null; /* never break a feature because logging failed */ }
}

export async function registerUsageApi(app: FastifyInstance) {
  app.get('/api/admin/feature-usage', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;
    const now = Date.now();
    const since = {
      today: new Date(new Date().setHours(0, 0, 0, 0)),
      last7d: new Date(now - 7 * 86400000),
      last30d: new Date(now - 30 * 86400000),
      allTime: new Date(0),
    };

    // Token totals per time window (across all features).
    const windowAgg = async (from: Date) => {
      const a = await prisma.featureUsage.aggregate({
        where: { createdAt: { gte: from } },
        _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
        _count: { _all: true },
      });
      const total = a._sum.totalTokens || 0;
      const count = a._count._all || 0;
      return {
        requests: count,
        totalTokens: total,
        promptTokens: a._sum.promptTokens || 0,
        completionTokens: a._sum.completionTokens || 0,
        avgTokens: count ? Math.round(total / count) : 0,
      };
    };

    // Breakdown per feature (all time).
    const grouped = await prisma.featureUsage.groupBy({
      by: ['feature'],
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: { _all: true },
    });
    const byFeature = grouped
      .map((g) => ({
        feature: g.feature,
        requests: g._count._all || 0,
        totalTokens: g._sum.totalTokens || 0,
        promptTokens: g._sum.promptTokens || 0,
        completionTokens: g._sum.completionTokens || 0,
        avgTokens: g._count._all ? Math.round((g._sum.totalTokens || 0) / g._count._all) : 0,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens);

    const recentRows = await prisma.featureUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: { createdAt: true, userLabel: true, feature: true, action: true, ref: true, model: true, totalTokens: true, promptTokens: true, completionTokens: true, status: true, rating: true, ratingNote: true },
    });

    return reply.send({
      today: await windowAgg(since.today),
      last7d: await windowAgg(since.last7d),
      last30d: await windowAgg(since.last30d),
      allTime: await windowAgg(since.allTime),
      byFeature,
      recent: recentRows,
    });
  });
}
