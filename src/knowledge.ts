import fs from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './db.js';
import { runRolePrompt } from './llm.js';
import { requireAuth, requireAdmin } from './auth.js';

type SourceType = 'confluence' | 'jira' | 'web' | 'local';

type KnowledgeDoc = {
  path: string;
  rootLabel: string;
  title: string;
  text: string;
  normalized: string;
  mtimeMs: number;
  sourceUrl?: string;
  sourceType: SourceType;
};

type KnowledgeSearchHit = {
  path: string;
  rootLabel: string;
  title: string;
  score: number;
  snippet: string;
  sourceUrl?: string;
  sourceType: SourceType;
};

const searchableExts = new Set(['.md', '.mdx', '.txt']);
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.audio_temp']);
const docRoots = [
  { label: 'documentation', relPath: 'workspaces/documentation' },
  { label: 'docs', relPath: 'docs' },
  { label: 'product', relPath: 'product' },
];

const scanCache: {
  docs: KnowledgeDoc[];
  scannedAt: number;
  roots: Array<{ label: string; path: string; files: number }>;
} = {
  docs: [],
  scannedAt: 0,
  roots: [],
};

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

// Parse a leading YAML-ish frontmatter block (--- ... ---) for source metadata.
// Recognised keys: title, source_url / url / confluence_url / jira_url, source_type.
function parseFrontmatter(raw: string): {
  body: string;
  title?: string;
  sourceUrl?: string;
  sourceType?: SourceType;
} {
  const match = raw.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { body: raw };

  const fm = match[1];
  const body = raw.slice(match[0].length);
  const meta: Record<string, string> = {};
  for (const line of fm.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, '');
    if (key) meta[key] = value;
  }

  const sourceUrl =
    meta.confluence_url || meta.jira_url || meta.source_url || meta.url || undefined;
  let sourceType = (meta.source_type as SourceType) || undefined;
  if (!sourceType && sourceUrl) sourceType = inferSourceType(sourceUrl);

  return { body, title: meta.title || undefined, sourceUrl, sourceType };
}

function inferSourceType(url: string): SourceType {
  const u = url.toLowerCase();
  if (u.includes('confluence') || u.includes('atlassian.net/wiki') || u.includes('/wiki/')) return 'confluence';
  if (u.includes('jira') || u.includes('atlassian.net/browse')) return 'jira';
  if (u.startsWith('http')) return 'web';
  return 'local';
}

function normalizeQuery(text: string) {
  return normalizeWhitespace(text).toLowerCase();
}

function detectQuestionLanguage(text: string) {
  const sample = normalizeWhitespace(text);
  if (!sample) return 'en';
  const cyrillicMatches = sample.match(/[А-Яа-яЁёІіЎў]/g) || [];
  const latinMatches = sample.match(/[A-Za-z]/g) || [];
  if (cyrillicMatches.length > latinMatches.length / 2) return 'ru';
  return 'en';
}

function queryTerms(query: string) {
  return Array.from(
    new Set(
      normalizeQuery(query)
        .split(/[^a-zA-Zа-яА-Я0-9]+/)
        .filter((term) => term.length >= 3),
    ),
  );
}

function inferIntent(question: string) {
  const q = normalizeQuery(question);
  if (/(bug|ошиб|problem|incident|issue|дефект)/.test(q)) return 'Bug';
  if (/(requirement|требован|нужно|надо|user story|acceptance)/.test(q)) return 'Requirement';
  if (/(plan|planning|estimate|оцен|спринт|roadmap)/.test(q)) return 'Planning';
  if (/(architecture|архитект|service|api|integration|интеграц)/.test(q)) return 'Architecture';
  if (/(risk|риск|impact|affected|затрон)/.test(q)) return 'Risk';
  return 'Question';
}

function deriveTopic(question: string, terms: string[]) {
  const clipped = normalizeWhitespace(question).slice(0, 96);
  const topic = terms.slice(0, 6).join(' ');
  return topic || clipped.toLowerCase();
}

function confidenceFromSources(hitCount: number, topScore: number) {
  const base = hitCount === 0 ? 0.12 : 0.34 + Math.min(0.38, hitCount * 0.07);
  const scoreBoost = Math.min(0.2, topScore / 50);
  return Number(Math.min(0.92, base + scoreBoost).toFixed(2));
}

function buildSnippet(text: string, terms: string[]) {
  const compact = normalizeWhitespace(text);
  if (!compact) return '';
  const lower = compact.toLowerCase();
  const idx = terms
    .map((term) => lower.indexOf(term))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];

  if (idx === undefined) return compact.slice(0, 220);

  const start = Math.max(0, idx - 80);
  const end = Math.min(compact.length, idx + 180);
  const snippet = compact.slice(start, end);
  return `${start > 0 ? '…' : ''}${snippet}${end < compact.length ? '…' : ''}`;
}

async function walkDocs(absRoot: string, label: string) {
  const docs: KnowledgeDoc[] = [];

  async function visit(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (ignoredDirs.has(entry.name)) continue;
        await visit(absPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!searchableExts.has(ext)) continue;

      try {
        const stat = await fs.stat(absPath);
        if (stat.size > 250_000) continue;
        const raw = await fs.readFile(absPath, 'utf8');
        const { body, title, sourceUrl, sourceType } = parseFrontmatter(raw);
        const text = normalizeWhitespace(body);
        if (!text) continue;

        const rel = path.relative(process.cwd(), absPath);
        docs.push({
          path: rel,
          rootLabel: label,
          title: title || path.basename(absPath, ext),
          text,
          normalized: text.toLowerCase(),
          mtimeMs: stat.mtimeMs,
          sourceUrl,
          sourceType: sourceType || 'local',
        });
      } catch {
        // Skip unreadable files but keep the index warm.
      }
    }
  }

  await visit(absRoot);
  return docs;
}

async function loadKnowledgeDocs(force = false) {
  const now = Date.now();
  if (!force && scanCache.docs.length && now - scanCache.scannedAt < 60_000) {
    return scanCache;
  }

  const allDocs: KnowledgeDoc[] = [];
  const roots: Array<{ label: string; path: string; files: number }> = [];

  for (const root of docRoots) {
    const absRoot = path.resolve(process.cwd(), root.relPath);
    const docs = await walkDocs(absRoot, root.label);
    allDocs.push(...docs);
    roots.push({ label: root.label, path: root.relPath, files: docs.length });
  }

  scanCache.docs = allDocs;
  scanCache.scannedAt = now;
  scanCache.roots = roots;
  return scanCache;
}

async function searchKnowledge(query: string) {
  const { docs } = await loadKnowledgeDocs();
  const terms = queryTerms(query);
  const normalizedQuestion = normalizeQuery(query);

  const hits: KnowledgeSearchHit[] = docs
    .map((doc) => {
      let score = 0;
      let matchedTerms = 0;

      for (const term of terms) {
        const pathMatches = doc.path.toLowerCase().includes(term) ? 1 : 0;
        const bodyMatches = doc.normalized.split(term).length - 1;
        if (pathMatches || bodyMatches) matchedTerms += 1;
        score += pathMatches * 8;
        score += Math.min(6, bodyMatches);
      }

      if (doc.normalized.includes(normalizedQuestion)) score += 16;
      if (matchedTerms === terms.length && terms.length > 0) score += 10;
      if (doc.title.toLowerCase().includes(terms[0] || '')) score += 4;

      return {
        path: doc.path,
        rootLabel: doc.rootLabel,
        title: doc.title,
        score,
        snippet: buildSnippet(doc.text, terms),
        sourceUrl: doc.sourceUrl,
        sourceType: doc.sourceType,
      };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return { hits, terms };
}

async function composeAnswer(question: string, hits: KnowledgeSearchHit[], language: string) {
  if (!hits.length) {
    const fallbackByLanguage: Record<string, string> = {
      ru: 'Не нашёл достаточно сильного ответа в проиндексированной документации. Попробуй сузить область продукта или добавь недостающие материалы в documentation/docs.',
      en: 'I could not find a strong answer in the indexed documentation yet. Try narrowing the product area or add the missing source materials into documentation/docs first.',
    };
    return {
      mode: 'fallback',
      answer: fallbackByLanguage[language] || fallbackByLanguage.en,
    };
  }

  const evidence = hits
    .slice(0, 5)
    .map(
      (hit, index) =>
        `Source ${index + 1}\ntitle: ${hit.title}\n${hit.sourceUrl ? `link: ${hit.sourceUrl}\n` : `path: ${hit.path}\n`}type: ${hit.sourceType}\nexcerpt: ${hit.snippet}`,
    )
    .join('\n\n');

  const prompt = `You are a product knowledge assistant inside an engineering workspace.

Answer the user's question using only the evidence below.

Rules:
- Be concrete and concise.
- If evidence is partial or conflicting, say that explicitly.
- Respond in the same language as the user's question. Current language: ${language}.
- End with a short "Sources:" line listing the most relevant file paths.
- Do not invent integrations, flows, or APIs that are not present in the evidence.

Question:
${question}

Evidence:
${evidence}`;

  if (String(process.env.MOCK_LLM || '').trim() === '1') {
    const bulletPoints = hits
      .slice(0, 4)
      .map((hit) => `- **${hit.title}**: ${hit.snippet}`)
      .join('\n');

    const intro =
      language === 'ru'
        ? `Вот лучший grounded-ответ, который я могу собрать по вопросу: "${question}"`
        : `Here is the best grounded answer I can assemble for: "${question}"`;
    const evidenceLabel = language === 'ru' ? 'Наиболее релевантные найденные материалы:' : 'Most relevant indexed evidence:';

    return {
      mode: 'mock-grounded',
      answer: [
        intro,
        '',
        evidenceLabel,
        bulletPoints,
      ].join('\n'),
    };
  }

  try {
    const result = await runRolePrompt('knowledge_assistant.answer', prompt);
    return { mode: 'llm', answer: result.text.trim() || hits[0].snippet };
  } catch {
    const intro =
      language === 'ru'
        ? `Вот лучший grounded-ответ, который я могу собрать по вопросу: "${question}"`
        : `Here is the best grounded answer I can assemble for: "${question}"`;
    const evidenceLabel = language === 'ru' ? 'Наиболее релевантные найденные материалы:' : 'Most relevant indexed evidence:';
    const fallback = [
      intro,
      '',
      evidenceLabel,
      ...hits.slice(0, 3).map((hit) => `- **${hit.title}**: ${hit.snippet}`),
    ].join('\n');

    return { mode: 'fallback', answer: fallback };
  }
}

async function registerGap(question: string, confidence: number, hitCount: number, intent: string, terms: string[]) {
  if (hitCount >= 2 && confidence >= 0.45) return;

  const topic = deriveTopic(question, terms);
  const title = topic.slice(0, 120);
  const existing = await prisma.knowledgeGap.findUnique({ where: { topic } });

  if (!existing) {
    await prisma.knowledgeGap.create({
      data: {
        topic,
        title,
        reason: hitCount === 0 ? 'No relevant indexed sources found' : 'Low confidence answer',
        lastQuestion: question,
        confidenceAvg: confidence,
        metadata: { intent, hitCount },
      },
    });
    return;
  }

  const currentConfidence = existing.confidenceAvg ?? confidence;
  const nextConfidence = Number(((currentConfidence * existing.occurrences + confidence) / (existing.occurrences + 1)).toFixed(2));

  await prisma.knowledgeGap.update({
    where: { topic },
    data: {
      occurrences: { increment: 1 },
      lastQuestion: question,
      confidenceAvg: nextConfidence,
      reason: hitCount === 0 ? 'No relevant indexed sources found' : 'Low confidence answer',
      metadata: { intent, hitCount },
    },
  });
}

function uniqueTopQuestions(rows: Array<{ normalizedQuestion: string | null; question: string }>) {
  const map = new Map<string, { question: string; count: number }>();
  for (const row of rows) {
    const key = row.normalizedQuestion || normalizeQuery(row.question);
    const prev = map.get(key);
    if (prev) prev.count += 1;
    else map.set(key, { question: row.question, count: 1 });
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function registerKnowledgeApi(app: FastifyInstance) {
  const askSchema = z.object({
    question: z.string().min(3),
    channel: z.string().min(1).max(120).optional(),
    languageHint: z.enum(['ru', 'en']).optional(),
    inputMode: z.enum(['text', 'voice']).default('text'),
  });

  app.get('/api/knowledge/status', async () => {
    const cache = await loadKnowledgeDocs();
    return {
      ok: true,
      scannedAt: new Date(cache.scannedAt).toISOString(),
      totalDocs: cache.docs.length,
      roots: cache.roots,
    };
  });

  app.post('/api/knowledge/reindex', async () => {
    const cache = await loadKnowledgeDocs(true);
    return {
      ok: true,
      scannedAt: new Date(cache.scannedAt).toISOString(),
      totalDocs: cache.docs.length,
      roots: cache.roots,
    };
  });

  app.get('/api/knowledge/search', async (req: any, reply) => {
    const question = String(req.query?.q || '').trim();
    if (!question) return reply.code(400).send({ error: 'q is required' });
    const result = await searchKnowledge(question);
    return result;
  });

  app.post('/api/knowledge/ask', async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;

    const parsed = askSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const started = Date.now();
    const language = parsed.data.languageHint || detectQuestionLanguage(parsed.data.question);
    const intent = inferIntent(parsed.data.question);
    const { hits, terms } = await searchKnowledge(parsed.data.question);
    const composed = await composeAnswer(parsed.data.question, hits, language);
    const latencyMs = Date.now() - started;
    const confidence = confidenceFromSources(hits.length, hits[0]?.score || 0);

    const saved = await prisma.knowledgeQuery.create({
      data: {
        userId: user.id,
        userLabel: user.name,
        channel: parsed.data.channel || 'web',
        inputMode: parsed.data.inputMode,
        question: parsed.data.question,
        normalizedQuestion: normalizeQuery(parsed.data.question),
        answer: composed.answer,
        answerMode: composed.mode,
        intent,
        confidence,
        latencyMs,
        sourceCount: hits.length,
        sources: hits.map((hit) => ({
          path: hit.path,
          title: hit.title,
          score: hit.score,
          rootLabel: hit.rootLabel,
          sourceUrl: hit.sourceUrl,
          sourceType: hit.sourceType,
        })),
      },
    });

    await registerGap(parsed.data.question, confidence, hits.length, intent, terms);

    return reply.send({
      queryId: saved.id,
      answer: composed.answer,
      intent,
      confidence,
      latencyMs,
      language,
      sources: hits,
    });
  });

  // Rating (1..5). A rating below 4 is the signal the UI uses to open feedback.
  const ratingSchema = z.object({ rating: z.number().int().min(1).max(5) });

  app.post('/api/knowledge/queries/:id/rating', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;

    const parsed = ratingSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const query = await prisma.knowledgeQuery.findUnique({ where: { id: String(req.params.id) } });
    if (!query) return reply.code(404).send({ error: 'Query not found' });
    if (query.userId && query.userId !== user.id && user.role !== 'admin') {
      return reply.code(403).send({ error: 'Cannot rate another user\'s query' });
    }

    await prisma.knowledgeQuery.update({
      where: { id: query.id },
      data: { rating: parsed.data.rating, ratedAt: new Date() },
    });

    return reply.send({ ok: true, rating: parsed.data.rating, feedbackRequired: parsed.data.rating < 4 });
  });

  // Feedback (text or voice-transcribed) — typically opened when rating < 4.
  const feedbackSchema = z.object({
    kind: z.enum(['text', 'voice']).default('text'),
    text: z.string().min(1).max(5000),
    rating: z.number().int().min(1).max(5).optional(),
  });

  app.post('/api/knowledge/queries/:id/feedback', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;

    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const query = await prisma.knowledgeQuery.findUnique({ where: { id: String(req.params.id) } });
    if (!query) return reply.code(404).send({ error: 'Query not found' });

    const feedback = await prisma.knowledgeFeedback.create({
      data: {
        queryId: query.id,
        userId: user.id,
        kind: parsed.data.kind,
        text: parsed.data.text,
        rating: parsed.data.rating ?? query.rating ?? undefined,
      },
    });

    // A low-rated answer with explicit feedback is a strong documentation signal.
    await registerGapFromFeedback(query, parsed.data.text);

    return reply.code(201).send({ ok: true, feedbackId: feedback.id });
  });

  // Correction / clarification proposed by the user for the received answer.
  const correctionSchema = z.object({ text: z.string().min(1).max(8000) });

  app.post('/api/knowledge/queries/:id/correction', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;

    const parsed = correctionSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const query = await prisma.knowledgeQuery.findUnique({ where: { id: String(req.params.id) } });
    if (!query) return reply.code(404).send({ error: 'Query not found' });

    const correction = await prisma.knowledgeCorrection.create({
      data: { queryId: query.id, userId: user.id, text: parsed.data.text },
    });

    return reply.code(201).send({ ok: true, correctionId: correction.id });
  });

  // Current user's own history (hidden behind a drawer in the UI).
  app.get('/api/knowledge/history', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;

    const limit = Math.min(Number(req.query?.limit || 30), 100);
    const rows = await prisma.knowledgeQuery.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        feedbacks: { orderBy: { createdAt: 'desc' } },
        corrections: { orderBy: { createdAt: 'desc' } },
      },
    });

    return reply.send({
      queries: rows.map((row: any) => ({
        id: row.id,
        createdAt: row.createdAt,
        question: row.question,
        answer: row.answer,
        intent: row.intent,
        confidence: row.confidence,
        rating: row.rating,
        inputMode: row.inputMode,
        sourceCount: row.sourceCount,
        sources: Array.isArray(row.sources) ? row.sources : [],
        feedbackCount: row.feedbacks.length,
        correctionCount: row.corrections.length,
      })),
    });
  });

  // --- Admin-only: full history + analytics ---

  app.get('/api/admin/knowledge/queries', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const limit = Math.min(Number(req.query?.limit || 200), 1000);
    const rows = await prisma.knowledgeQuery.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        feedbacks: { orderBy: { createdAt: 'asc' } },
        corrections: { orderBy: { createdAt: 'asc' } },
      },
    });

    return reply.send({
      queries: rows.map((row: any) => ({
        id: row.id,
        createdAt: row.createdAt,
        question: row.question,
        answer: row.answer,
        intent: row.intent,
        confidence: row.confidence,
        rating: row.rating,
        ratedAt: row.ratedAt,
        inputMode: row.inputMode,
        sourceCount: row.sourceCount,
        sources: Array.isArray(row.sources) ? row.sources : [],
        user: row.user
          ? { id: row.user.id, name: row.user.name, email: row.user.email, role: row.user.role }
          : { name: row.userLabel || 'Unknown', email: null, role: null },
        feedbacks: row.feedbacks.map((f: any) => ({
          id: f.id,
          kind: f.kind,
          text: f.text,
          rating: f.rating,
          createdAt: f.createdAt,
        })),
        corrections: row.corrections.map((c: any) => ({
          id: c.id,
          text: c.text,
          status: c.status,
          createdAt: c.createdAt,
        })),
      })),
    });
  });

  app.get('/api/admin/knowledge/analytics', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;
    return reply.send(await buildAnalytics());
  });
}

async function buildAnalytics() {
    const [queries, gaps] = await Promise.all([
      prisma.knowledgeQuery.findMany({
        orderBy: { createdAt: 'desc' },
        take: 250,
      }),
      prisma.knowledgeGap.findMany({
        orderBy: [{ occurrences: 'desc' }, { updatedAt: 'desc' }],
        take: 20,
      }),
    ]);

    const topQuestions = uniqueTopQuestions(queries);
    const intentMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalLatency = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    for (const query of queries) {
      totalLatency += query.latencyMs ?? 0;
      if (typeof query.confidence === 'number') {
        confidenceSum += query.confidence;
        confidenceCount += 1;
      }
      if (typeof query.rating === 'number') {
        ratingSum += query.rating;
        ratingCount += 1;
        ratingDist[query.rating] = (ratingDist[query.rating] || 0) + 1;
      }
      if (query.intent) intentMap.set(query.intent, (intentMap.get(query.intent) || 0) + 1);

      const sources = Array.isArray(query.sources) ? (query.sources as Array<any>) : [];
      for (const source of sources) {
        const key = String(source?.path || '');
        if (!key) continue;
        sourceMap.set(key, (sourceMap.get(key) || 0) + 1);
      }
    }

    return {
      totals: {
        queries: queries.length,
        avgLatencyMs: queries.length ? Math.round(totalLatency / queries.length) : 0,
        avgConfidence: confidenceCount ? Number((confidenceSum / confidenceCount).toFixed(2)) : 0,
        avgRating: ratingCount ? Number((ratingSum / ratingCount).toFixed(2)) : 0,
        ratedQueries: ratingCount,
      },
      ratingDistribution: ratingDist,
      topQuestions,
      intents: Array.from(intentMap.entries())
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      topSources: Array.from(sourceMap.entries())
        .map(([pathValue, count]) => ({ path: pathValue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      gaps: gaps.map((gap: any) => ({
        id: gap.id,
        topic: gap.topic,
        title: gap.title,
        status: gap.status,
        occurrences: gap.occurrences,
        confidenceAvg: gap.confidenceAvg,
        lastQuestion: gap.lastQuestion,
        updatedAt: gap.updatedAt,
      })),
    };
}

// A low-rated answer with written feedback is a strong signal that the
// underlying documentation is missing or unclear — record it as a gap.
async function registerGapFromFeedback(
  query: { question: string; intent: string | null; confidence: number | null },
  feedbackText: string,
) {
  const terms = queryTerms(query.question);
  const topic = deriveTopic(query.question, terms);
  const existing = await prisma.knowledgeGap.findUnique({ where: { topic } });
  const reason = `User feedback: ${feedbackText.slice(0, 200)}`;

  if (!existing) {
    await prisma.knowledgeGap.create({
      data: {
        topic,
        title: topic.slice(0, 120),
        reason,
        lastQuestion: query.question,
        confidenceAvg: query.confidence ?? undefined,
        metadata: { intent: query.intent, viaFeedback: true },
      },
    });
    return;
  }

  await prisma.knowledgeGap.update({
    where: { topic },
    data: {
      occurrences: { increment: 1 },
      reason,
      lastQuestion: query.question,
      metadata: { intent: query.intent, viaFeedback: true },
    },
  });
}
