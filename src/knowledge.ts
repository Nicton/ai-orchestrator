import fs from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './db.js';
import { runRolePrompt, transcribeAudioBuffer } from './llm.js';

type KnowledgeDoc = {
  path: string;
  rootLabel: string;
  title: string;
  text: string;
  normalized: string;
  tokens: string[];
  titleTokens: string[];
  pathTokens: string[];
  mtimeMs: number;
};

type KnowledgeSearchHit = {
  path: string;
  rootLabel: string;
  title: string;
  score: number;
  rawScore: number;
  termMatches: number;
  snippet: string;
};

type CanonicalDomainKey = 'tms';

type QueryProfile = {
  isDefinitionQuery: boolean;
  canonicalDomain?: CanonicalDomainKey;
};

type KnowledgeRootConfig = {
  label: string;
  relPaths: string[];
  weight: number;
};

const searchableExts = new Set(['.md', '.mdx', '.txt']);
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.audio_temp']);
const docRoots: KnowledgeRootConfig[] = [
  { label: 'knowledge-base', relPaths: ['../../knowledge-base', 'knowledge-base'], weight: 1.35 },
  { label: 'documentation', relPaths: ['workspaces/documentation'], weight: 1.15 },
  { label: 'docs', relPaths: ['docs'], weight: 1.0 },
  { label: 'product', relPaths: ['product'], weight: 0.95 },
];
const pathScoreRules = [
  { pattern: /(^|\/)open-questions(\.md)?$/i, multiplier: 0.35 },
  { pattern: /(^|\/)todo(s)?(\.md)?$/i, multiplier: 0.45 },
  { pattern: /(^|\/)draft(s)?\//i, multiplier: 0.6 },
  { pattern: /(^|\/)readme(\.md)?$/i, multiplier: 0.9 },
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

function tokenize(text: string) {
  return normalizeQuery(text)
    .split(/[^a-zA-Zа-яА-ЯёЁ0-9]+/)
    .filter(Boolean);
}

function detectQuestionLanguage(text: string) {
  const sample = normalizeWhitespace(text);
  if (!sample) return 'en';
  const cyrillicMatches = sample.match(/[А-Яа-яЁёІіЎў]/g) || [];
  const latinMatches = sample.match(/[A-Za-z]/g) || [];
  if (cyrillicMatches.length > latinMatches.length / 2) return 'ru';
  const frenchMarkers = sample.match(/[À-ÿœŒçÇ]/g) || [];
  if (frenchMarkers.length > 0 || /\b(quel|quelle|quelles|quels|quoi|comment|pourquoi|avec|sans|dans|est|une|des|les|bonjour|merci)\b/i.test(sample)) {
    return 'fr';
  }
  return 'en';
}

function normalizeAnswerLanguage(language?: string) {
  const normalized = String(language || '').trim().toLowerCase();
  if (normalized === 'ru' || normalized === 'en' || normalized === 'fr') return normalized;
  return 'en';
}

function parseLanguageHint(language?: string) {
  const normalized = String(language || '').trim().toLowerCase();
  if (normalized === 'ru' || normalized === 'en' || normalized === 'fr') return normalized;
  return undefined;
}

function localizedCopy(language: string) {
  const lang = normalizeAnswerLanguage(language);
  return {
    noAnswer: {
      ru: 'Не нашёл достаточно сильного ответа в проиндексированной базе знаний. Попробуй сузить область продукта или добавь недостающие материалы в knowledge-base / documentation / docs.',
      en: 'I could not find a strong answer in the indexed knowledge base yet. Try narrowing the product area or add the missing source materials into knowledge-base / documentation / docs first.',
      fr: 'Je n’ai pas encore trouvé de réponse suffisamment solide dans la base de connaissances indexée. Essaie de préciser la zone produit ou ajoute les sources manquantes dans knowledge-base / documentation / docs.',
    },
    synthesisUnavailable: {
      ru: 'Нашёл релевантные материалы, но сейчас не смог собрать финальный ответ. Ниже оставляю источники, чтобы ты сразу мог открыть нужные документы.',
      en: 'I found relevant source materials, but I could not synthesize the final answer right now. I am listing the sources below so you can open the right documents immediately.',
      fr: 'J’ai trouvé des sources pertinentes, mais je n’ai pas réussi à synthétiser la réponse finale pour le moment. Je laisse les sources ci-dessous pour que tu puisses ouvrir directement les bons documents.',
    },
  } as const;
}

function queryTerms(query: string) {
  return Array.from(new Set(tokenize(query).filter((term) => term.length >= 3)));
}

const definitionQuestionPatterns = [
  /\bwhat\s+is\b/i,
  /\bwhat'?s\b/i,
  /\bdefine\b/i,
  /\bmeaning\s+of\b/i,
  /\bexplain\b/i,
  /\bqu['’]est[- ]ce\s+que\b/i,
  /\bque\s+signifie\b/i,
  /\bчто\s+такое\b/i,
  /\bэто\s+что\b/i,
];

const canonicalDefinitionPathPatterns = [
  /(^|\/)00_overview\.md$/i,
  /(^|\/)01_taxonomy\.md$/i,
  /(^|\/)02_glossary\.md$/i,
  /(^|\/)03_roles\.md$/i,
  /(^|\/)00_index\.md$/i,
  /(^|\/)01_product_map\.md$/i,
  /(^|\/)05_glossary\.md$/i,
  /(^|\/)02_roles_and_access\.md$/i,
];

const tmsCanonicalPathPatterns = [
  /^knowledge-base\/tms\/(00_overview|01_taxonomy|02_glossary|03_roles)\.md$/i,
  /^knowledge-base\/internal\/1\.0\/(00_INDEX|01_PRODUCT_MAP|02_ROLES_AND_ACCESS|05_GLOSSARY)\.md$/i,
];

function inferIntent(question: string) {
  const q = normalizeQuery(question);
  if (/(bug|ошиб|problem|incident|issue|дефект)/.test(q)) return 'Bug';
  if (/(requirement|требован|нужно|надо|user story|acceptance)/.test(q)) return 'Requirement';
  if (/(plan|planning|estimate|оцен|спринт|roadmap)/.test(q)) return 'Planning';
  if (/(architecture|архитект|service|api|integration|интеграц)/.test(q)) return 'Architecture';
  if (/(risk|риск|impact|affected|затрон)/.test(q)) return 'Risk';
  return 'Question';
}

function isDefinitionQuery(question: string, terms: string[]) {
  const normalized = normalizeQuery(question);
  if (definitionQuestionPatterns.some((pattern) => pattern.test(normalized))) return true;
  if (terms.length <= 4 && /\b(tms|sr|qr|eta|edi|api)\b/i.test(question) && /\?$/.test(question.trim())) return true;
  return false;
}

function detectCanonicalDomain(question: string, terms: string[]): CanonicalDomainKey | undefined {
  const normalized = normalizeQuery(question);
  if (terms.includes('tms') || normalized.includes('transport management system')) return 'tms';
  return undefined;
}

function buildQueryProfile(question: string, terms: string[]): QueryProfile {
  const definition = isDefinitionQuery(question, terms);
  return {
    isDefinitionQuery: definition,
    canonicalDomain: definition ? detectCanonicalDomain(question, terms) : undefined,
  };
}

function deriveTopic(question: string, terms: string[]) {
  const clipped = normalizeWhitespace(question).slice(0, 96);
  const topic = terms.slice(0, 6).join(' ');
  return topic || clipped.toLowerCase();
}

function pathScoreMultiplier(docPath: string) {
  return pathScoreRules.reduce((multiplier, rule) => (
    rule.pattern.test(docPath) ? multiplier * rule.multiplier : multiplier
  ), 1);
}

function isCanonicalDefinitionDoc(docPath: string) {
  return canonicalDefinitionPathPatterns.some((pattern) => pattern.test(docPath));
}

function isCanonicalDomainDoc(docPath: string, domain?: CanonicalDomainKey) {
  if (!domain) return false;
  if (domain === 'tms') return tmsCanonicalPathPatterns.some((pattern) => pattern.test(docPath));
  return false;
}

function definitionDocBoost(docPath: string, profile: QueryProfile) {
  if (!profile.isDefinitionQuery) return 0;

  let boost = 0;
  if (isCanonicalDefinitionDoc(docPath)) boost += 18;
  if (isCanonicalDomainDoc(docPath, profile.canonicalDomain)) boost += 20;
  if (profile.canonicalDomain === 'tms' && /(^|\/)tms\//i.test(docPath)) boost += 8;
  return boost;
}

function confidenceFromHits(
  hits: KnowledgeSearchHit[],
  termCount: number,
  profile: QueryProfile,
  answerMode: 'llm' | 'fallback',
) {
  if (!hits.length) return 0.08;

  const topHits = hits.slice(0, 3);
  const topHit = topHits[0];
  const safeTermCount = Math.max(termCount, 1);
  const matchedTermRatio = Math.min(1, topHit.termMatches / safeTermCount);
  const coverageRatio = Math.min(
    1,
    topHits.reduce((sum, hit) => sum + hit.termMatches, 0) / (safeTermCount * 2),
  );
  const normalizedTopScore = Math.min(1, topHit.score / 28);
  const evidenceDiversity = new Set(topHits.map((hit) => hit.rootLabel)).size / Math.min(3, topHits.length);
  const trustedTopEvidence = topHits.filter((hit) => hit.rootLabel === 'knowledge-base' || hit.rootLabel === 'documentation').length;
  const trustedEvidenceRatio = trustedTopEvidence / topHits.length;
  const canonicalTopHits = hits.slice(0, 5).filter((hit) => isCanonicalDomainDoc(hit.path, profile.canonicalDomain) || isCanonicalDefinitionDoc(hit.path));
  const canonicalCoverage = Math.min(1, canonicalTopHits.length / 3);
  const canonicalTopLead = canonicalTopHits.some((hit) => hit.path === topHit.path) ? 1 : 0;

  const rawConfidence = 0.1
    + matchedTermRatio * 0.28
    + coverageRatio * 0.18
    + normalizedTopScore * 0.18
    + evidenceDiversity * 0.08
    + trustedEvidenceRatio * 0.18
    + (profile.isDefinitionQuery ? canonicalCoverage * 0.14 + canonicalTopLead * 0.06 : 0);

  let adjusted = rawConfidence;
  if (profile.isDefinitionQuery && canonicalTopHits.length === 0) adjusted = Math.min(adjusted, 0.67);
  if (answerMode !== 'llm') adjusted -= profile.isDefinitionQuery ? 0.18 : 0.12;

  const cap = profile.isDefinitionQuery
    ? (canonicalTopHits.length >= 2 && answerMode === 'llm' ? 0.93 : 0.78)
    : (topHit.rootLabel === 'knowledge-base' ? 0.84 : 0.76);

  return Number(Math.max(0.08, Math.min(cap, adjusted)).toFixed(2));
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
          tokens: tokenize(text),
          titleTokens: tokenize(path.basename(absPath, ext)),
          pathTokens: tokenize(rel),
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

async function pathExists(absPath: string) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveRootPath(root: KnowledgeRootConfig) {
  for (const relPath of root.relPaths) {
    const absPath = path.resolve(process.cwd(), relPath);
    if (await pathExists(absPath)) {
      return { absPath, relPath };
    }
  }
  return {
    absPath: path.resolve(process.cwd(), root.relPaths[0] || '.'),
    relPath: root.relPaths[0] || '.',
  };
}

async function loadKnowledgeDocs(force = false) {
  const now = Date.now();
  if (!force && scanCache.docs.length && now - scanCache.scannedAt < 60_000) {
    return scanCache;
  }

  const allDocs: KnowledgeDoc[] = [];
  const roots: Array<{ label: string; path: string; files: number }> = [];

  for (const root of docRoots) {
    const { absPath: absRoot, relPath } = await resolveRootPath(root);
    const docs = await walkDocs(absRoot, root.label);
    allDocs.push(...docs);
    roots.push({ label: root.label, path: relPath, files: docs.length });
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
  const profile = buildQueryProfile(query, terms);

  const hits: KnowledgeSearchHit[] = docs
    .map((doc) => {
      let rawScore = 0;
      let matchedTerms = 0;

      for (const term of terms) {
        const pathMatches = doc.pathTokens.filter((token) => token === term).length;
        const titleMatches = doc.titleTokens.filter((token) => token === term).length;
        const bodyMatches = doc.tokens.filter((token) => token === term).length;
        if (pathMatches || titleMatches || bodyMatches) matchedTerms += 1;
        rawScore += pathMatches * 8;
        rawScore += titleMatches * 10;
        rawScore += Math.min(6, bodyMatches * 2);
      }

      if (doc.normalized.includes(normalizedQuestion)) rawScore += 16;
      if (matchedTerms === terms.length && terms.length > 0) rawScore += 10;
      if (terms[0] && doc.titleTokens.includes(terms[0])) rawScore += 4;
      rawScore += definitionDocBoost(doc.path, profile);

      const rootWeight = docRoots.find((root) => root.label === doc.rootLabel)?.weight || 1;
      const weightedScore = rawScore * rootWeight * pathScoreMultiplier(doc.path);

      return {
        path: doc.path,
        rootLabel: doc.rootLabel,
        title: doc.title,
        score: Number(weightedScore.toFixed(2)),
        rawScore: Number(rawScore.toFixed(2)),
        termMatches: matchedTerms,
        snippet: buildSnippet(doc.text, terms),
      };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return { hits, terms, profile };
}

function buildDefinitionFallback(hits: KnowledgeSearchHit[], language: string, profile: QueryProfile) {
  const lang = normalizeAnswerLanguage(language);
  const canonicalHits = hits.filter((hit) => isCanonicalDomainDoc(hit.path, profile.canonicalDomain) || isCanonicalDefinitionDoc(hit.path)).slice(0, 4);
  const sourceList = canonicalHits.length ? canonicalHits : hits.slice(0, 4);
  const sourcePaths = sourceList.map((hit) => hit.path).join(', ');

  if (profile.canonicalDomain === 'tms') {
    const messages = {
      ru: `TMS в этой базе знаний трактуется как Transport Management System и описывается через канонический слой документов: overview, taxonomy, glossary и roles. По текущим источникам это домен про shipment/booking lifecycle, execution planning, tracking и supporting master data. Sources: ${sourcePaths}`,
      en: `In this knowledge base, TMS is treated as the Transport Management System and is defined through the canonical overview, taxonomy, glossary, and roles documents. Based on the current sources, it covers the shipment/booking lifecycle, execution planning, tracking, and supporting master data. Sources: ${sourcePaths}`,
      fr: `Dans cette base de connaissances, le TMS est défini comme le Transport Management System via les documents canoniques overview, taxonomy, glossary et roles. D’après les sources actuelles, il couvre le cycle shipment/booking, la planification d’exécution, le tracking et les master data de support. Sources: ${sourcePaths}`,
    } as const;
    return messages[lang];
  }

  const generic = {
    ru: `Нашёл канонические документы по определению термина, но финальный synthesis сейчас недоступен. Начни с этих источников: ${sourcePaths}`,
    en: `I found the canonical definition documents for this term, but the final synthesis is unavailable right now. Start with these sources: ${sourcePaths}`,
    fr: `J’ai trouvé les documents canoniques qui définissent ce terme, mais la synthèse finale est indisponible pour le moment. Commence par ces sources : ${sourcePaths}`,
  } as const;
  return generic[lang];
}

async function composeAnswer(
  question: string,
  hits: KnowledgeSearchHit[],
  language: string,
  profile: QueryProfile,
): Promise<{ mode: 'llm' | 'fallback'; answer: string }> {
  const lang = normalizeAnswerLanguage(language);
  const copy = localizedCopy(lang);

  if (!hits.length) {
    return {
      mode: 'fallback',
      answer: copy.noAnswer[lang],
    };
  }

  const evidence = hits
    .slice(0, 5)
    .map(
      (hit, index) =>
        `Source ${index + 1}\npath: ${hit.path}\ntitle: ${hit.title}\nexcerpt: ${hit.snippet}`,
    )
    .join('\n\n');

  const answerStyleBlock = profile.isDefinitionQuery
    ? `This is a definitional question. Prefer the canonical definition flow:
- start with overview / taxonomy / glossary / roles if present;
- define the term in one sentence first;
- then list the main functional scope in 3-6 bullets;
- if the canonical docs are present, treat them as higher priority than narrower feature pages.`
    : `Answer in the style that best fits the question.`;

  const prompt = `You are a product knowledge assistant inside an engineering workspace.

Answer the user's question using only the evidence below.

Rules:
- Be concrete and concise.
- If evidence is partial or conflicting, say that explicitly.
- Respond fully in the requested answer language. Current language: ${lang}.
- End with a short "Sources:" line listing the most relevant file paths.
- Do not invent integrations, flows, or APIs that are not present in the evidence.
 - ${answerStyleBlock}

Question:
${question}

Evidence:
${evidence}`;

  try {
    const result = await runRolePrompt('knowledge_assistant.answer', prompt);
    const answer = result.text.trim();
    if (answer) return { mode: 'llm', answer };
    if (profile.isDefinitionQuery) return { mode: 'fallback', answer: buildDefinitionFallback(hits, lang, profile) };
    return { mode: 'fallback', answer: copy.synthesisUnavailable[lang] };
  } catch {
    if (profile.isDefinitionQuery) {
      return {
        mode: 'fallback',
        answer: buildDefinitionFallback(hits, lang, profile),
      };
    }
    return {
      mode: 'fallback',
      answer: copy.synthesisUnavailable[lang],
    };
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
    languageHint: z.enum(['ru', 'en', 'fr']).optional(),
  });

  app.post('/api/knowledge/transcribe', async (req: any, reply) => {
    if (!req.isMultipart()) {
      return reply.code(415).send({ error: 'Expected multipart/form-data' });
    }

    const file = await req.file();
    if (!file) return reply.code(400).send({ error: 'audio file is required' });

    const languageHintRaw = String(file.fields?.languageHint?.value || '').trim().toLowerCase();
    const hintedLanguage = parseLanguageHint(languageHintRaw);
    const audioBuffer = await file.toBuffer();
    const transcript = await transcribeAudioBuffer(audioBuffer, file.filename || 'voice.webm');

    return reply.send({
      text: transcript.text,
      model: transcript.model,
      language: normalizeAnswerLanguage(transcript.language || hintedLanguage || detectQuestionLanguage(transcript.text)),
    });
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
    const language = normalizeAnswerLanguage(parsed.data.languageHint || detectQuestionLanguage(parsed.data.question));
    const intent = inferIntent(parsed.data.question);
    const { hits, terms, profile } = await searchKnowledge(parsed.data.question);
    const composed = await composeAnswer(parsed.data.question, hits, language, profile);
    const latencyMs = Date.now() - started;
    const confidence = confidenceFromHits(hits, terms.length, profile, composed.mode);

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
