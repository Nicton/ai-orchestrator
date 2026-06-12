import fs from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './db.js';
import { runRolePrompt } from './llm.js';

type KnowledgeDoc = {
  path: string;
  rootLabel: string;
  title: string;
  text: string;
  normalized: string;
  mtimeMs: number;
};

type KnowledgeSearchHit = {
  path: string;
  rootLabel: string;
  title: string;
  score: number;
  snippet: string;
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
        const text = normalizeWhitespace(raw);
        if (!text) continue;

        const rel = path.relative(process.cwd(), absPath);
        docs.push({
          path: rel,
          rootLabel: label,
          title: path.basename(absPath, ext),
          text,
          normalized: text.toLowerCase(),
          mtimeMs: stat.mtimeMs,
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
        `Source ${index + 1}\npath: ${hit.path}\ntitle: ${hit.title}\nexcerpt: ${hit.snippet}`,
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
    userLabel: z.string().min(1).max(200).optional(),
    channel: z.string().min(1).max(120).optional(),
    languageHint: z.enum(['ru', 'en']).optional(),
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
        userLabel: parsed.data.userLabel,
        channel: parsed.data.channel,
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

  app.get('/api/knowledge/queries', async (req: any) => {
    const limit = Math.min(Number(req.query?.limit || 20), 100);
    const rows = await prisma.knowledgeQuery.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      queries: rows.map((row: any) => ({
        id: row.id,
        createdAt: row.createdAt,
        question: row.question,
        answer: row.answer,
        intent: row.intent,
        confidence: row.confidence,
        sourceCount: row.sourceCount,
        latencyMs: row.latencyMs,
      })),
    };
  });

  app.get('/api/knowledge/analytics', async () => {
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
    let totalLatency = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    for (const query of queries) {
      totalLatency += query.latencyMs ?? 0;
      if (typeof query.confidence === 'number') {
        confidenceSum += query.confidence;
        confidenceCount += 1;
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
      },
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
  });
}
