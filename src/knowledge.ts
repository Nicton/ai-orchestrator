import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './db.js';
import { runRolePrompt, transcribeAudioFile, analyzeImages } from './llm.js';
import { putImage, getImage, storageReady } from './storage.js';
import { config } from './config.js';
import { requireAuth, requireAdmin } from './auth.js';
import { safeJsonParse } from './json.js';

type SourceType = 'confluence' | 'jira' | 'web' | 'local';

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
  sourceUrl?: string;
  sourceType: SourceType;
};

type KnowledgeSearchHit = {
  path: string;
  rootLabel: string;
  title: string;
  score: number;
  rawScore: number;
  termMatches: number;
  snippet: string;
  evidence?: string; // крупный фрагмент тела (для топ-хитов → в контекст LLM)
  _text?: string;    // временно: полный текст дока (удаляется после отбора топа)
  sourceUrl?: string;
  sourceType: SourceType;
};

type KnowledgeSuggestion = {
  original: string;
  suggested: string;
  reason: 'transliteration';
};

type PlannedQueryVariant = {
  query: string;
  rationale: string;
};

type KnowledgeQueryPlan = {
  originalQuestion: string;
  normalizedQuestion: string;
  language: 'ru' | 'en' | 'fr';
  intent: string;
  answerStyle: 'direct' | 'table' | 'steps' | 'links' | 'compare';
  entities: string[];
  searchQueries: PlannedQueryVariant[];
};

type PlannedSearchResult = {
  hits: KnowledgeSearchHit[];
  terms: string[];
  suggestion: KnowledgeSuggestion | null;
  plan: KnowledgeQueryPlan;
  profile: QueryProfile;
};

type CanonicalDomainKey = 'tms';

type QueryProfile = {
  isDefinitionQuery: boolean;
  canonicalDomain?: CanonicalDomainKey;
};

type KnowledgeRootConfig = {
  label: string;
  relPath: string;
  weight: number;
};

const searchableExts = new Set(['.md', '.mdx', '.txt']);
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.audio_temp']);
const docRoots: KnowledgeRootConfig[] = [
  // First-class authoritative knowledge base, indexed from the repo root.
  { label: 'knowledge-base', relPath: 'knowledge-base', weight: 1.35 },
  { label: 'documentation', relPath: 'workspaces/documentation', weight: 1.15 },
  { label: 'docs', relPath: 'docs', weight: 1.0 },
  { label: 'product', relPath: 'product', weight: 0.95 },
];

// Weight for sources that are not file roots (e.g. the DB-backed operational
// knowledge store, including knowledge written back from applied corrections).
// It is the highest weight so corrected/curated truth wins over raw files.
const NON_FILE_ROOT_WEIGHTS: Record<string, number> = {
  operational: 1.5,
};
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '..');

function rootWeight(label: string): number {
  const fileRoot = docRoots.find((root) => root.label === label);
  if (fileRoot) return fileRoot.weight;
  return NON_FILE_ROOT_WEIGHTS[label] ?? 1;
}
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

function tokenize(text: string) {
  return normalizeQuery(text)
    .split(/[^a-zA-Zа-яА-ЯёЁ0-9]+/)
    .filter(Boolean);
}

const queryStopwords = new Set([
  'что', 'это', 'зачем', 'какой', 'какая', 'какие', 'как', 'где', 'когда', 'почему', 'ли',
  'или', 'для', 'про', 'надо', 'нужно', 'есть', 'нет', 'мне', 'меня', 'него', 'неё', 'нее',
  'знаю', 'расскажи', 'расскажи', 'покажи', 'объясни', 'подскажи', 'скучно',
  'the', 'what', 'why', 'how', 'when', 'where', 'which', 'who', 'does', 'do', 'is', 'are',
  'tell', 'show', 'about', 'please', 'a', 'an',
]);

function detectQuestionLanguage(text: string) {
  const sample = normalizeWhitespace(text);
  if (!sample) return 'en';
  const cyrillicMatches = sample.match(/[А-Яа-яЁёІіЎў]/g) || [];
  if (cyrillicMatches.length) return 'ru';
  const frenchAccentMatches = sample.match(/[àâæçéèêëîïôœùûüÿ]/gi) || [];
  if (frenchAccentMatches.length) return 'fr';

  const latinMatches = sample.match(/[A-Za-z]/g) || [];
  if (cyrillicMatches.length > latinMatches.length / 2) return 'ru';
  const lowered = sample.toLowerCase();
  const frenchSignals = [
    'bonjour', 'bonsoir', 'merci', 'pourquoi', 'comment', 'avec', 'sans', 'dans',
    'est', 'sont', 'être', 'avoir', 'peut', 'livraison', 'transport', 'question',
  ];
  const frenchHits = frenchSignals.filter((word) => lowered.includes(word)).length;
  if (frenchHits >= 2) return 'fr';
  return 'en';
}

function normalizeAnswerLanguage(language?: string) {
  const normalized = String(language || '').trim().toLowerCase();
  if (normalized === 'ru' || normalized === 'en' || normalized === 'fr') return normalized;
  return 'en';
}

function supportContact() {
  return {
    name: String(process.env.ADMIN_NAME || 'Support owner').trim() || 'Support owner',
    email: String(process.env.ADMIN_EMAIL || 'support@example.com').trim() || 'support@example.com',
  };
}

function localizedAnswerCopy(language: string) {
  const lang = normalizeAnswerLanguage(language);
  const contact = supportContact();
  return {
    noAnswer: {
      ru: 'Не нашёл достаточно сильного ответа в проиндексированной базе знаний. Попробуй сузить область продукта или добавь недостающие материалы в knowledge-base / documentation / docs.',
      en: 'I could not find a strong answer in the indexed knowledge base yet. Try narrowing the product area or add the missing source materials into knowledge-base / documentation / docs first.',
      fr: 'Je n’ai pas encore trouvé de réponse assez solide dans la base de connaissances indexée. Essaie de préciser le domaine produit ou d’ajouter les sources manquantes dans knowledge-base / documentation / docs.',
    },
    synthesisUnavailable: {
      ru: 'Я нашёл релевантные материалы, но сейчас не смог собрать финальный ответ. Ниже оставил источники, чтобы можно было сразу открыть нужные документы.',
      en: 'I found relevant source materials, but I could not synthesize the final answer right now. I left the sources below so you can open the right documents immediately.',
      fr: 'J’ai trouvé des sources pertinentes, mais je n’ai pas réussi à synthétiser la réponse finale pour le moment. J’ai laissé les sources ci-dessous pour que tu puisses ouvrir directement les bons documents.',
    },
    llmUnavailable: {
      ru: `⚠️ Адаптированный (LLM) ответ временно недоступен из-за проблем с подключением к Claude Code CLI. Обратитесь к ${contact.name} (${contact.email}).`,
      en: `⚠️ The adapted (LLM) answer is temporarily unavailable due to a Claude Code CLI connection issue. Please contact ${contact.name} (${contact.email}).`,
      fr: `⚠️ La réponse adaptée (LLM) est temporairement indisponible en raison d’un problème de connexion à Claude Code CLI. Veuillez contacter ${contact.name} (${contact.email}).`,
    },
    speculativeNotice: {
      ru: '⚠️ **Режим «Додумывания».** Точного ответа в документации нет — ниже обоснованное предположение на основе общей логики приложения и смежных материалов. **Требует проверки**, не используйте как подтверждённый факт.',
      en: '⚠️ **Speculative ("best-guess") mode.** No exact answer is documented — below is a reasoned inference from the general application logic and related materials. **Needs verification**, do not treat as confirmed fact.',
      fr: '⚠️ **Mode « supposition ».** Aucune réponse exacte n’est documentée — ci-dessous une déduction raisonnée à partir de la logique générale de l’application. **À vérifier**, ne pas considérer comme un fait confirmé.',
    },
  } as const;
}

function queryTerms(query: string) {
  const tokens = tokenize(query).filter((term) => term.length >= 3);
  const filtered = tokens.filter((term) => !queryStopwords.has(term));
  return Array.from(new Set(filtered.length ? filtered : tokens));
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

const cyrillicToLatinMap: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ы: 'y',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ь: '',
  ъ: '',
};

function transliterateCyrillicToken(token: string) {
  if (!/^[а-яё]+$/i.test(token)) return token;
  return token
    .toLowerCase()
    .split('')
    .map((char) => cyrillicToLatinMap[char] ?? char)
    .join('');
}

function buildTransliterationSuggestion(query: string): KnowledgeSuggestion | null {
  const parts = query.trim().split(/\s+/);
  if (!parts.length) return null;

  let changed = false;
  const suggested = parts.map((part) => {
    const match = part.match(/^([^A-Za-zА-Яа-яЁё0-9]*)([A-Za-zА-Яа-яЁё0-9-]+)([^A-Za-zА-Яа-яЁё0-9]*)$/);
    if (!match) return part;

    const [, prefix, core, suffix] = match;
    if (!/^[а-яё-]{2,8}$/i.test(core) || /[aeiouy]/i.test(core)) return part;

    const transliterated = core
      .split('-')
      .map((chunk) => transliterateCyrillicToken(chunk))
      .join('-');

    if (!transliterated || transliterated === core.toLowerCase()) return part;
    changed = true;
    return `${prefix}${transliterated}${suffix}`;
  }).join(' ');

  if (!changed) return null;
  return {
    original: query,
    suggested,
    reason: 'transliteration',
  };
}

function rankKnowledgeDocs(docs: KnowledgeDoc[], query: string, profile: QueryProfile) {
  const terms = queryTerms(query);
  const normalizedQuestion = normalizeQuery(query);

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

      const weightedScore = rawScore * rootWeight(doc.rootLabel) * pathScoreMultiplier(doc.path);

      return {
        path: doc.path,
        rootLabel: doc.rootLabel,
        title: doc.title,
        score: Number(weightedScore.toFixed(2)),
        rawScore: Number(rawScore.toFixed(2)),
        termMatches: matchedTerms,
        snippet: buildSnippet(doc.text, terms),
        _text: doc.text,
        sourceUrl: doc.sourceUrl,
        sourceType: doc.sourceType,
      };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // Топ-хитам даём крупный фрагмент тела (вокруг всех совпадений) для контекста LLM;
  // остальным хватает короткого snippet. _text удаляем, чтобы не утёк в ответ/БД.
  hits.forEach((h, i) => {
    if (i < 3) h.evidence = buildEvidence(h._text || '', terms);
    delete h._text;
  });

  return { hits, terms };
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

function inferAnswerStyle(question: string): KnowledgeQueryPlan['answerStyle'] {
  const q = normalizeQuery(question);
  if (/(table|таблиц|matrix|mapping|compare|сравн|difference|разниц|variant|вариант|vs\b)/.test(q)) return 'table';
  if (/(step|steps|how to|как|процесс|workflow|instruction|инструкц)/.test(q)) return 'steps';
  if (/(link|links|url|ссылк|where doc|где документац)/.test(q)) return 'links';
  if (/(compare|сравн|difference|разниц|versus|vs\b)/.test(q)) return 'compare';
  return 'direct';
}

function fallbackQueryPlan(question: string, languageHint?: string): KnowledgeQueryPlan {
  const normalizedQuestion = normalizeWhitespace(question);
  const terms = queryTerms(question);
  const transliteration = buildTransliterationSuggestion(question);
  const queryParts = normalizedQuestion.split(/\s+/).filter(Boolean);
  const searchQueries: PlannedQueryVariant[] = [];

  searchQueries.push({ query: normalizedQuestion, rationale: 'original question' });
  if (terms.length) {
    searchQueries.push({
      query: terms.slice(0, 8).join(' '),
      rationale: 'keyword-focused query',
    });
  }
  if (
    transliteration
    && transliteration.suggested !== normalizedQuestion
    && queryParts.length <= 3
  ) {
    searchQueries.push({
      query: transliteration.suggested,
      rationale: 'cyrillic-to-latin abbreviation fallback',
    });
  }

  return {
    originalQuestion: question,
    normalizedQuestion,
    language: (languageHint as KnowledgeQueryPlan['language']) || detectQuestionLanguage(question) as KnowledgeQueryPlan['language'],
    intent: inferIntent(question),
    answerStyle: inferAnswerStyle(question),
    entities: terms.slice(0, 5),
    searchQueries: dedupeQueryVariants(searchQueries).slice(0, 4),
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
  answerMode: 'llm' | 'fallback' | 'speculative',
  fallbackKind?: 'definition' | 'generic',
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
  if (answerMode !== 'llm') {
    if (fallbackKind === 'definition' && profile.isDefinitionQuery && canonicalTopHits.length >= 2) {
      adjusted -= 0.04;
    } else {
      adjusted -= profile.isDefinitionQuery ? 0.18 : 0.12;
    }
  }

  const cap = profile.isDefinitionQuery
    ? (
      canonicalTopHits.length >= 2
        ? (answerMode === 'llm' ? 0.93 : fallbackKind === 'definition' ? 0.88 : 0.78)
        : 0.78
    )
    : (topHit.rootLabel === 'knowledge-base' ? 0.84 : 0.76);

  // Режим «Додумывания» — это предположение: жёстко ограничиваем уверенность.
  if (answerMode === 'speculative') return Number(Math.max(0.08, Math.min(0.4, adjusted)).toFixed(2));

  return Number(Math.max(0.08, Math.min(cap, adjusted)).toFixed(2));
}

function buildSnippet(text: string, terms: string[]) {
  const compact = normalizeWhitespace(text);
  if (!compact) return '';
  const lower = compact.toLowerCase();
  const prioritizedTerms = [...terms].sort((a, b) => b.length - a.length);
  const idx = prioritizedTerms
    .map((term) => lower.indexOf(term))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];

  if (idx === undefined) return compact.slice(0, 220);

  const start = Math.max(0, idx - 80);
  const end = Math.min(compact.length, idx + 180);
  const snippet = compact.slice(start, end);
  return `${start > 0 ? '…' : ''}${snippet}${end < compact.length ? '…' : ''}`;
}

// Признак «ответ по сути не дан» — триггер для режима глубокого додумывания.
function looksInsufficient(text: string): boolean {
  const t = (text || '').toLowerCase();
  if (!t) return true;
  return [
    'evidence does not', 'does not contain', 'not contain', 'insufficient', 'no information',
    'cannot answer', 'unable to answer', 'only the header', 'only its title', 'only a one-line',
    'нет данных', 'не содержит', 'недостаточно', 'не могу ответить', 'нет информации', 'не удалось найти',
  ].some((m) => t.includes(m));
}

// Крупный фрагмент тела дока для контекста LLM: окна (±400) вокруг ВСЕХ вхождений
// терминов запроса, слитые и ограниченные бюджетом (~2800 симв). Если совпадений нет —
// первые ~2600 символов. Решает кейс, когда термин матчит заголовок, а ответ — в теле.
function buildEvidence(text: string, terms: string[]) {
  const compact = normalizeWhitespace(text);
  if (!compact) return '';
  // Короткий док (типичная спека/use-case) — отдаём ЦЕЛИКОМ: ответ гарантированно в контексте.
  if (compact.length <= 6000) return compact;
  // Длинный док — лид (структура) + окна вокруг совпадений терминов (до 8 на термин).
  const lower = compact.toLowerCase();
  const positions: number[] = [];
  for (const t of [...new Set(terms)].filter((x) => x && x.length >= 3)) {
    let from = 0, idx: number, count = 0;
    while ((idx = lower.indexOf(t, from)) >= 0 && count < 8) { positions.push(idx); from = idx + t.length; count++; }
  }
  positions.sort((a, b) => a - b);
  const wins: Array<{ s: number; e: number }> = [{ s: 0, e: 1600 }]; // всегда включаем начало
  for (const p of positions) {
    const s = Math.max(0, p - 350), e = Math.min(compact.length, p + 450);
    const last = wins[wins.length - 1];
    if (s <= last.e + 60) last.e = Math.max(last.e, e);
    else wins.push({ s, e });
  }
  let out = '', budget = 5000;
  for (const w of wins) {
    if (budget <= 0) break;
    const chunk = compact.slice(w.s, w.s + Math.min(w.e - w.s, budget));
    out += `${w.s > 0 ? '…' : ''}${chunk}${w.e < compact.length ? '…' : ''}\n`;
    budget -= chunk.length;
  }
  return out.trim();
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

        const rel = path.relative(REPO_ROOT, absPath);
        docs.push({
          path: rel,
          rootLabel: label,
          title: title || path.basename(absPath, ext),
          text,
          normalized: text.toLowerCase(),
          tokens: tokenize(text),
          titleTokens: tokenize(title || path.basename(absPath, ext)),
          pathTokens: tokenize(rel),
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
    const absRoot = path.resolve(REPO_ROOT, root.relPath);
    const docs = await walkDocs(absRoot, root.label);
    allDocs.push(...docs);
    roots.push({ label: root.label, path: root.relPath, files: docs.length });
  }

  // Operational knowledge store (DB-backed). This is where curated entries and
  // knowledge written back from applied corrections live — highest priority.
  const operationalDocs = await loadOperationalDocs();
  allDocs.push(...operationalDocs);
  roots.push({ label: 'operational', path: 'db:KnowledgeEntry', files: operationalDocs.length });

  scanCache.docs = allDocs;
  scanCache.scannedAt = now;
  scanCache.roots = roots;
  return scanCache;
}

// Load approved entries from the DB-backed operational knowledge store and
// expose them as searchable docs. Failures (e.g. no DB) degrade to file-only.
async function loadOperationalDocs(): Promise<KnowledgeDoc[]> {
  try {
    const entries = await prisma.knowledgeEntry.findMany({
      where: { status: 'APPROVED' },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    return entries.map((entry) => {
      const text = normalizeWhitespace(`${entry.title}. ${entry.body}`);
      const sourceType = (entry.sourceType as SourceType) || 'local';
      return {
        path: `db:knowledge-entry/${entry.id}`,
        rootLabel: 'operational',
        title: entry.title,
        text,
        normalized: text.toLowerCase(),
        tokens: tokenize(text),
        titleTokens: tokenize(entry.title),
        pathTokens: tokenize(`db knowledge entry ${entry.id}`),
        mtimeMs: entry.updatedAt.getTime(),
        sourceUrl: entry.sourceUrl || undefined,
        sourceType: ['confluence', 'jira', 'web', 'local'].includes(sourceType) ? sourceType : 'local',
      } satisfies KnowledgeDoc;
    });
  } catch {
    return [];
  }
}

function dedupeQueryVariants(variants: PlannedQueryVariant[]) {
  const seen = new Set<string>();
  const unique: PlannedQueryVariant[] = [];
  for (const variant of variants) {
    const query = normalizeWhitespace(variant.query);
    const key = normalizeQuery(query);
    if (!query || !key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ query, rationale: variant.rationale || 'search variant' });
  }
  return unique;
}

const queryPlannerSchema = z.object({
  normalizedQuestion: z.string().min(1).max(500),
  language: z.enum(['ru', 'en', 'fr']),
  intent: z.string().min(1).max(80),
  answerStyle: z.enum(['direct', 'table', 'steps', 'links', 'compare']),
  entities: z.array(z.string().min(1).max(120)).max(8).default([]),
  searchQueries: z.array(z.object({
    query: z.string().min(1).max(300),
    rationale: z.string().min(1).max(180),
  })).min(1).max(4),
});

async function buildQueryPlan(question: string, languageHint?: string): Promise<KnowledgeQueryPlan> {
  const fallback = fallbackQueryPlan(question, languageHint);
  const prompt = `You are planning retrieval for a grounded product knowledge assistant.

Return JSON only.

Task:
- Normalize the user's question for retrieval.
- Infer the best intent label.
- Pick the most useful answer style.
- Generate 2 to 4 high-value search queries for document retrieval.
- Expand abbreviations or transliterations only when strongly justified by the question itself.
- Preserve product names and likely domain terms.

Rules:
- Keep the same user language in normalizedQuestion.
- searchQueries must be short and retrieval-oriented, not full answers.
- Include the original wording or a very close variant as one of the searchQueries.
- When the question mixes Cyrillic with Latin abbreviations, include a Latin variant if it could materially help retrieval.
- Do not invent entities that are not implied by the question.
- intent should be a compact label like Question, Requirement, Architecture, Compare, HowTo, Links, Status, Bug.
- answerStyle should be one of: direct, table, steps, links, compare.

Question:
${question}

Language hint:
${fallback.language}

Return shape:
{
  "normalizedQuestion": "string",
  "language": "ru|en|fr",
  "intent": "string",
  "answerStyle": "direct|table|steps|links|compare",
  "entities": ["string"],
  "searchQueries": [
    { "query": "string", "rationale": "string" }
  ]
}`;

  try {
    const result = await runRolePrompt('knowledge_assistant.query_planner', prompt, config.answerModel);
    const parsed = queryPlannerSchema.parse(safeJsonParse(result.text));
    return {
      originalQuestion: question,
      normalizedQuestion: normalizeWhitespace(parsed.normalizedQuestion),
      language: parsed.language,
      intent: parsed.intent,
      answerStyle: parsed.answerStyle,
      entities: parsed.entities.map((item) => normalizeWhitespace(item)).filter(Boolean).slice(0, 8),
      searchQueries: dedupeQueryVariants(parsed.searchQueries).slice(0, 4),
    };
  } catch {
    return fallback;
  }
}

function mergeHitsByPath(
  scoredHits: Array<KnowledgeSearchHit & { variantIndex: number }>,
  variantCount: number,
) {
  const merged = new Map<string, KnowledgeSearchHit>();
  const hitVariants = new Map<string, Set<number>>();

  for (const hit of scoredHits) {
    const existing = merged.get(hit.path);
    const variants = hitVariants.get(hit.path) || new Set<number>();
    variants.add(hit.variantIndex);
    hitVariants.set(hit.path, variants);

    const diversityBoost = variants.size > 1 ? 1 + ((variants.size - 1) * 0.12) : 1;
    const score = Number((hit.score * diversityBoost).toFixed(2));
    if (!existing || score > existing.score) {
      merged.set(hit.path, {
        path: hit.path,
        rootLabel: hit.rootLabel,
        title: hit.title,
        score,
        rawScore: hit.rawScore,
        termMatches: hit.termMatches,
        snippet: hit.snippet,
        sourceUrl: hit.sourceUrl,
        sourceType: hit.sourceType,
      });
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(8, Math.max(variantCount * 3, 6)));
}

async function searchKnowledge(query: string, languageHint?: string): Promise<PlannedSearchResult> {
  const { docs } = await loadKnowledgeDocs();
  const plan = await buildQueryPlan(query, languageHint);
  const profile = buildQueryProfile(query, queryTerms(query));
  const variants = dedupeQueryVariants([
    { query, rationale: 'user wording' },
    { query: plan.normalizedQuestion, rationale: 'normalized question' },
    ...plan.searchQueries,
  ]).slice(0, 5);

  const collectedTerms = new Set<string>();
  const scoredHits: Array<KnowledgeSearchHit & { variantIndex: number }> = [];
  let appliedSuggestion: KnowledgeSuggestion | null = null;

  variants.forEach((variant, variantIndex) => {
    const primary = rankKnowledgeDocs(docs, variant.query, profile);
    primary.terms.forEach((term) => collectedTerms.add(term));
    let effectiveHits = primary.hits;

    if (!effectiveHits.length) {
      const suggestion = buildTransliterationSuggestion(variant.query);
      if (suggestion) {
        const fallback = rankKnowledgeDocs(docs, suggestion.suggested, profile);
        fallback.terms.forEach((term) => collectedTerms.add(term));
        if (fallback.hits.length) {
          effectiveHits = fallback.hits;
          if (!appliedSuggestion && normalizeQuery(suggestion.suggested) !== normalizeQuery(query)) {
            appliedSuggestion = suggestion;
          }
        } else if (!appliedSuggestion && variantIndex === 0) {
          appliedSuggestion = suggestion;
        }
      }
    }

    effectiveHits.forEach((hit) => {
      const variantBoost = variantIndex === 0 ? 1.12 : variantIndex === 1 ? 1.06 : 1;
      scoredHits.push({
        ...hit,
        score: Number((hit.score * variantBoost).toFixed(2)),
        variantIndex,
      });
    });
  });

  const hits = mergeHitsByPath(scoredHits, variants.length);
  return {
    hits,
    terms: Array.from(collectedTerms),
    suggestion: appliedSuggestion,
    plan,
    profile,
  };
}

function buildDefinitionFallback(hits: KnowledgeSearchHit[], language: string, profile: QueryProfile) {
  const lang = normalizeAnswerLanguage(language);
  const canonicalHits = hits
    .filter((hit) => isCanonicalDomainDoc(hit.path, profile.canonicalDomain) || isCanonicalDefinitionDoc(hit.path))
    .slice(0, 4);
  const sourceList = canonicalHits.length ? canonicalHits : hits.slice(0, 4);
  const sourceRefs = sourceList.map((hit) => hit.sourceUrl || hit.path).join(', ');

  if (profile.canonicalDomain === 'tms') {
    const messages = {
      ru: `TMS в этой базе знаний трактуется как Transport Management System и определяется через канонический слой документов: overview, taxonomy, glossary и roles. По текущим источникам это домен про shipment/booking lifecycle, execution planning, tracking и supporting master data. Sources: ${sourceRefs}`,
      en: `In this knowledge base, TMS is treated as the Transport Management System and is defined through the canonical overview, taxonomy, glossary, and roles documents. Based on the current sources, it covers the shipment/booking lifecycle, execution planning, tracking, and supporting master data. Sources: ${sourceRefs}`,
      fr: `Dans cette base de connaissances, le TMS est défini comme le Transport Management System via les documents canoniques overview, taxonomy, glossary et roles. D’après les sources actuelles, il couvre le cycle shipment/booking, la planification d’exécution, le tracking et les master data de support. Sources: ${sourceRefs}`,
    } as const;
    return messages[lang];
  }

  const generic = {
    ru: `Нашёл канонические документы по определению термина, но финальный synthesis сейчас недоступен. Начни с этих источников: ${sourceRefs}`,
    en: `I found the canonical definition documents for this term, but the final synthesis is unavailable right now. Start with these sources: ${sourceRefs}`,
    fr: `J’ai trouvé les documents canoniques qui définissent ce terme, mais la synthèse finale est indisponible pour le moment. Commence par ces sources : ${sourceRefs}`,
  } as const;
  return generic[lang];
}

// Токены запроса с транслитерацией кириллицы (тмс → tms) для сопоставления с узлами графа.
function gcTokens(q: string): string[] {
  const tr: Record<string, string> = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
  const stop = new Set(['что','как','где','для','под','саб','sub','the','what','which','есть','модули','модуль','module','modules','подмодули','про','pro','мне','расскажи','rasskazhi','покажи','дай','tell','about','show','рассказать','какие','какой','this','есть','your','our']);
  const out = new Set<string>();
  for (const w of (q.toLowerCase().match(/[a-zа-я0-9]{3,}/gi) || [])) {
    if (!stop.has(w)) out.add(w);
    if (/[а-яё]/.test(w)) { const t = w.split('').map((c) => (c in tr ? tr[c] : c)).join(''); if (t.length >= 2 && !stop.has(t)) out.add(t); }
  }
  return [...out];
}

// Расстояние Левенштейна (для нечёткого сопоставления «док»→«dock», «тмс»→«tms»).
function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

// Граф-навигация: для структурных вопросов («какие саб-модули/фичи/экраны в X»)
// собираем авторитетный контекст прямо из графа знаний (KnowledgeEntity/Relation).
async function graphContext(question: string, plan?: KnowledgeQueryPlan): Promise<string> {
  try {
    const terms = [...new Set([...(plan?.entities || []).map((s) => s.toLowerCase()), ...gcTokens(question)])].filter((t) => t.length >= 3);
    if (!terms.length) return '';
    // Берём все модули/области/фичи (немного) и сопоставляем нечётко в JS —
    // SQL `contains` не ловит «dok»→«dock», поэтому матчим по сегментам + Левенштейну.
    const cands = await prisma.knowledgeEntity.findMany({ where: { type: { in: ['module', 'area', 'feature'] } }, take: 2000 });
    const score = (e: any) => {
      const segs = [e.name.toLowerCase(), ...e.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)];
      let best = 0;
      for (const t of terms) for (const s of segs) {
        if (s === t) best = Math.max(best, 6);
        else if (s.length >= 3 && (s.startsWith(t) || t.startsWith(s))) best = Math.max(best, 3);
        else { const d = lev(s, t); const mx = Math.max(s.length, t.length); if (mx >= 3 && d <= (mx < 6 ? 1 : 2)) best = Math.max(best, 4 - d); }
      }
      const typeW = ({ module: 3, area: 2, feature: 1 } as any)[e.type] || 0;
      return best > 0 ? best + typeW : 0;
    };
    const ranked = cands.map((e: any) => ({ e, s: score(e) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    if (!ranked.length) return '';
    const blocks: string[] = [];
    for (const root of ranked.slice(0, 2).map((x) => x.e)) {
      const rels = await prisma.knowledgeRelation.findMany({ where: { OR: [{ fromId: root.id }, { toId: root.id }] }, take: 500 });
      const otherIds = [...new Set(rels.map((r: any) => (r.fromId === root.id ? r.toId : r.fromId)))];
      const others = await prisma.knowledgeEntity.findMany({ where: { id: { in: otherIds } } });
      const byId: Record<string, any> = Object.fromEntries(others.map((o: any) => [o.id, o]));
      const cat: Record<string, Set<string>> = { area: new Set(), feature: new Set(), screen: new Set(), modal: new Set(), requirement: new Set(), document: new Set() };
      for (const r of rels) { const o = byId[r.fromId === root.id ? r.toId : r.fromId]; if (o && cat[o.type]) cat[o.type].add(o.name); }
      const fmt = (label: string, set: Set<string>) => (set.size ? `  ${label} (${set.size}): ${[...set].slice(0, 25).join(', ')}` : '');
      const lines = [fmt('под-области', cat.area), fmt('фичи', cat.feature), fmt('экраны', cat.screen), fmt('модальные окна', cat.modal), fmt('требования', cat.requirement), fmt('документы', cat.document)].filter(Boolean);
      const kind = root.type === 'module' ? 'Модуль' : root.type === 'area' ? 'Под-область' : 'Фича';
      if (lines.length) blocks.push(`${kind} «${root.name}» содержит:\n${lines.join('\n')}`);
    }
    return blocks.join('\n\n');
  } catch {
    return '';
  }
}

// ── Code dive: when the answer needs the actual implementation, read the real
// source under workspaces/ (baked into the image) and answer from it. ──
const CODE_EXT_RE = /\.(?:js|ts|jsx|tsx|mjs|cjs|vue|py)$/i;
const WORKSPACES_ROOT = path.resolve(process.cwd(), 'workspaces');
// All code repos a hint may live in. frontend-mono is the MAIN frontend (was
// missing → frontend/UI answers were never found); keep them ahead of backend
// so UI questions resolve to the frontend.
const CODE_REPOS = ['frontend-mono', 'backend', 'public-api', 'back-office', 'admin-app', 'mini-apps', 'frontend', 'microservices', 'integrations', 'notifications', 'public-api-docs', 'generate'];
// Repos that hold the user-facing UI (for "where/how in the system" answers).
const FRONTEND_REPOS = ['frontend-mono', 'back-office', 'admin-app', 'mini-apps', 'frontend'];

function gitSh(cmd: string, cwd: string, timeoutMs = 25000): Promise<string> {
  return new Promise((resolve) => exec(cmd, { cwd, timeout: timeoutMs, maxBuffer: 12 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (err, stdout) => resolve(err ? '' : String(stdout))));
}

async function resolveCodePath(hint: string): Promise<string | null> {
  const clean = hint.replace(/[:#].*$/, '').replace(/^[`'"(]+|[`'")]+$/g, '').trim();
  if (!clean || !CODE_EXT_RE.test(clean) || clean.includes('..')) return null;
  const norm = clean.replace(/^workspaces\//, '').replace(/^\.\//, '');
  const cands = [norm, ...CODE_REPOS.map((r) => `${r}/${norm}`)];
  for (const c of cands) {
    const p = path.join(WORKSPACES_ROOT, c);
    if (!p.startsWith(WORKSPACES_ROOT)) continue;
    try { if ((await fs.stat(p)).isFile()) return p; } catch { /* not here */ }
  }
  return null;
}

// Does the question ask WHERE/HOW to do something in the product (UI/link)?
function needsUi(q: string): boolean {
  return /\bгде\b|как (?:получить|найти|создать|выпустить|сгенерировать|открыть|настроить|включить)|откуда|ссылк|страниц|раздел|интерфейс|меню|кнопк|настройк|where|how (?:do i|to|can i)|which (?:page|screen|menu)|link|url|page|screen|button|settings|navigate/i.test(String(q));
}
// Grounded answer admits it's missing the concrete location/steps → worth a
// code dive (esp. for "where/how" questions that need a UI link).
function answerUncertain(a: string): boolean {
  return /неясно|не\s*(?:ясно|указан|понятн|нашл|найден|описан)|отсутству|нет\s+(?:информации|данных|инструкц)|должн[аы]?\s+содержать|уточнит|to be confirmed|unclear|not\s+(?:clear|specified|documented|covered)|couldn'?t find|insufficient|недостаточно|не\s+приведен/i.test(String(a));
}
// Distinctive English terms from grounded text → grep targets in code (the
// question is usually RU but code/identifiers are EN).
function englishGrepTerms(s: string): string[] {
  const stop = new Set(['this', 'that', 'with', 'from', 'code', 'file', 'have', 'will', 'your', 'which', 'where', 'when', 'what', 'should', 'these', 'there', 'about', 'using', 'into', 'also', 'than', 'then', 'them', 'they', 'data', 'user', 'page', 'true', 'false', 'null', 'value', 'name', 'type', 'list', 'item']);
  const freq = new Map<string, number>();
  for (const w of String(s).match(/[A-Za-z][A-Za-z0-9]{2,}/g) || []) {
    const lw = w.toLowerCase();
    if (stop.has(lw)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 6);
}
// git grep across given repos; returns absolute file paths (caps to `limit`).
// Uses --all-match (files containing ALL top terms) for precision, falling back
// to the 2 most distinctive terms, so common words ("api","key") don't match
// everything.
async function grepRepos(terms: string[], repos: string[], limit: number): Promise<string[]> {
  const clean = [...new Set(terms.filter((t) => t && t.length > 2).map((t) => t.replace(/[^A-Za-z0-9]/g, '.')))];
  if (!clean.length) return [];
  // longer/compound terms first — they're more distinctive
  clean.sort((a, b) => b.length - a.length);
  const tryGrep = async (ts: string[]): Promise<string[]> => {
    if (!ts.length) return [];
    const eArgs = ts.map((t) => `-e "${t}"`).join(' ');
    const out: string[] = [];
    for (const repo of repos) {
      const cwd = path.join(WORKSPACES_ROOT, repo);
      try { if (!(await fs.stat(path.join(cwd, '.git'))).isDirectory()) continue; } catch { continue; }
      const res = await gitSh(`git -c safe.directory='*' grep -lIiE --all-match ${eArgs} -- "*.js" "*.ts" "*.jsx" "*.tsx" "*.vue"`, cwd);
      for (const rel of res.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 5)) {
        out.push(path.join(cwd, rel));
        if (out.length >= limit) return out;
      }
    }
    return out;
  };
  // try the top 3 terms ANDed; relax progressively if nothing matches
  for (const n of [3, 2, 1]) {
    const r = await tryGrep(clean.slice(0, n));
    if (r.length) return r;
  }
  return [];
}
function extractCodeHints(text: string): { paths: string[]; idents: string[] } {
  const paths = new Set<string>();
  for (const m of String(text).matchAll(/((?:[\w@.-]+\/){1,}[\w.-]+\.(?:js|ts|jsx|tsx|mjs|cjs|vue|py))/g)) paths.add(m[1]);
  const idents = new Set<string>();
  for (const m of String(text).matchAll(/`([a-zA-Z_][a-zA-Z0-9_]{3,})\(?\)?`/g)) idents.add(m[1].replace(/\(\)$/, ''));
  return { paths: [...paths].slice(0, 14), idents: [...idents].slice(0, 10) };
}
// Did the model punt to "go read the code"? (or did the doc answer fall short)
function needsCode(t: string): boolean {
  return /смотреть в код|в коде\b|посмотреть\s+(?:в\s+)?код|исходник|look at the code|check the (?:source )?code|in the (?:source )?code|see the (?:source )?code|read(?:ing)? the (?:code|implementation|source)|нужно смотреть/i.test(String(t));
}
async function codeDive(
  question: string,
  sourceText: string,
  lang: string,
  progress?: { stage: (m: string) => void; delta: (t: string) => void },
): Promise<{ answer: string; files: string[]; result: Awaited<ReturnType<typeof runRolePrompt>> } | null> {
  const { paths, idents } = extractCodeHints(sourceText);
  const files: Array<{ path: string; text: string }> = [];
  const seen = new Set<string>();
  const CAP = 6;
  const addFile = async (real: string | null) => {
    if (!real || seen.has(real) || files.length >= CAP) return;
    seen.add(real);
    try {
      const txt = await fs.readFile(real, 'utf8');
      files.push({ path: path.relative(WORKSPACES_ROOT, real).split(path.sep).join('/'), text: txt });
    } catch { /* skip unreadable */ }
  };
  // For "where/how in the UI" questions, cap backend hints so the frontend
  // search (below) always gets slots — the user needs the UI location.
  const nav = needsUi(question);
  const pathCap = nav ? 3 : CAP;
  for (const h of paths) { if (files.length >= pathCap) break; await addFile(await resolveCodePath(h)); }

  // Frontend-aware: for "where/how in the UI" questions — or whenever no
  // frontend file was hinted — search the frontend repos so we can answer with
  // the actual screen/route/link, not just backend logic.
  const hasFrontend = files.some((f) => FRONTEND_REPOS.some((r) => f.path.startsWith(`${r}/`)));
  if (nav || !hasFrontend) {
    const terms = [...idents, ...englishGrepTerms(sourceText), ...englishGrepTerms(question)];
    try {
      const hits = await grepRepos(terms, FRONTEND_REPOS, 2);
      if (hits.length) progress?.stage(`🖥 Ищу на фронте: ${hits.map((h) => path.relative(WORKSPACES_ROOT, h).split(path.sep).join('/')).join(', ')}`);
      for (const real of hits) { if (files.length >= CAP) break; await addFile(real); }
    } catch { /* grep best-effort */ }
  }

  if (!files.length) return null;
  progress?.stage(`📂 Читаю исходный код: ${files.map((f) => f.path).join(', ')}`);
  const terms = [...idents, ...tokenize(question)];
  const block = files.map((f) => {
    const body = f.text.length > 7000 ? buildEvidence(f.text, terms) : f.text;
    return `FILE: ${f.path}\n\`\`\`\n${body.slice(0, 7000)}\n\`\`\``;
  }).join('\n\n');
  const prompt = `You are a senior Shiptify engineer with access to the ACTUAL SOURCE CODE below (backend AND frontend repos). The documentation did not fully answer the question, so answer by READING THE CODE. Be concrete: state the exact behavior and cite file + function. Source code is authoritative — if it answers the question, give the definitive answer (do NOT punt with "look at the code").
IMPORTANT: if the question is about WHERE or HOW to do something in the product (e.g. how to get/find something in the UI), the user needs a FRONT-END answer — name the screen/page, the navigation path (menu → section), and the route/URL if visible in the frontend code (e.g. router path in frontend-mono / back-office / admin-app). Backend logic alone is NOT a sufficient answer to a "where/how do I…" question. If the provided files genuinely do not contain the answer, say precisely what is missing and which file would hold it. Respond in language: ${lang}. End with a "Sources:" line listing the code files you used.

Question:
${question}

SOURCE CODE:
${block}`;
  const r = await runRolePrompt('engineer.code_answer', prompt, config.answerModel, progress?.delta);
  const ans = (r.text || '').trim();
  if (!ans || looksInsufficient(ans)) return null;
  return { answer: ans, files: files.map((f) => f.path), result: r };
}

async function composeAnswer(
  question: string,
  hits: KnowledgeSearchHit[],
  language: string,
  plan?: KnowledgeQueryPlan,
  profile?: QueryProfile,
  progress?: { stage: (msg: string) => void; delta: (text: string) => void },
  allowSpeculative = true,
): Promise<{ mode: 'llm' | 'fallback' | 'speculative'; answer: string; fallbackKind?: 'definition' | 'generic'; usedGraph?: boolean; llmLog?: string; promptTokens?: number; completionTokens?: number; totalTokens?: number; model?: string }> {
  const lang = normalizeAnswerLanguage(language);
  const copy = localizedAnswerCopy(lang);
  const graphCtx = await graphContext(question, plan);
  const usedGraph = !!graphCtx;
  progress?.stage(graphCtx ? '🕸 Контекст из графа знаний найден' : '🕸 Граф знаний: прямых совпадений нет');

  if (!hits.length && !graphCtx) {
    return {
      mode: 'fallback',
      answer: copy.noAnswer[lang],
      fallbackKind: 'generic',
    };
  }

  // Evidence для топ-хитов строим на ФИНАЛЬНЫХ хитах (после слияния query-вариантов),
  // доставая полный текст дока из кэша по path — чтобы тело спеки гарантированно попало в контекст.
  const evTerms = tokenize(question);
  const { docs: cachedDocs } = await loadKnowledgeDocs();
  const textByPath = new Map(cachedDocs.map((d) => [d.path, d.text]));
  const docEvidence = hits
    .slice(0, 5)
    .map((hit, index) => {
      const full = textByPath.get(hit.path);
      const excerpt = (index < 3 && full) ? buildEvidence(full, evTerms) : (hit.evidence || hit.snippet);
      return `Source ${index + 1}\ntitle: ${hit.title}\n${hit.sourceUrl ? `link: ${hit.sourceUrl}\n` : `path: ${hit.path}\n`}type: ${hit.sourceType}\nexcerpt: ${excerpt}`;
    })
    .join('\n\n');
  const evidence = (graphCtx ? `ГРАФ ЗНАНИЙ (структура проекта — авторитетно для вопросов «что входит в X / какие саб-модули, фичи, экраны»):\n${graphCtx}\n\n` : '') + docEvidence;

  const answerStyleBlock = profile?.isDefinitionQuery
    ? `This is a definitional question. Prefer the canonical definition flow:
- start with overview / taxonomy / glossary / roles if present;
- define the term in one sentence first;
- then list the main functional scope in 3-6 bullets;
- if the canonical docs are present, treat them as higher priority than narrower feature pages.`
    : 'Answer in the style that best fits the question.';

  const prompt = `You are Searchify, a product knowledge assistant inside an engineering workspace.

Answer the user's question using ONLY the evidence below.

Rules:
- Be concrete, useful, and concise.
- Adapt the output shape to the user's question instead of dumping raw search snippets.
- Start with the direct answer immediately. Do not add filler like "Here is the best grounded answer".
- If the user asks for a count, comparison, status matrix, mapping, or list of variants, prefer a compact markdown table.
- Preferred answer style for this question: ${plan?.answerStyle || inferAnswerStyle(question)}.
- If the evidence supports only a partial answer, explicitly separate "What is clear" from "What is unclear".
- When evidence contains URLs, include a short "Links:" section with the most relevant raw URLs.
- If a "ГРАФ ЗНАНИЙ" block is present, treat it as AUTHORITATIVE for structural/inventory questions (what sub-modules / features / screens / modals / requirements a module or area contains). List its items directly and group them clearly.
- Ground every claim in the evidence. Do NOT invent entities, roles, processes, APIs, integrations, permissions, or limitations that are not present in the evidence.
- If the evidence is partial, outdated, or conflicting, say so explicitly.
- If the evidence does not actually answer the question, say honestly that the information is insufficient instead of guessing.
- CRITICAL: Respond strictly in the SAME language requested for the answer (detected: ${lang}). Mirror that language even if the evidence is in another language.
- ${answerStyleBlock}
- End with a short "Sources:" line listing the most relevant titles/paths.

Preferred answer shape:
1. Direct answer
2. Optional details or table, only if it genuinely helps
3. Optional Links section
4. Sources line

Question:
${question}

Retrieval plan:
- normalized question: ${plan?.normalizedQuestion || normalizeWhitespace(question)}
- intent: ${plan?.intent || inferIntent(question)}
- entities: ${(plan?.entities || []).join(', ') || 'n/a'}
- search variants: ${(plan?.searchQueries || []).map((item) => item.query).join(' | ') || question}

Evidence:
${evidence}`;

  progress?.stage(`🤖 Запрос к Claude (${config.answerModel})…`);
  let llmAnswer = '';
  let result: Awaited<ReturnType<typeof runRolePrompt>> | undefined;
  let threw = '';
  try {
    result = await runRolePrompt('knowledge_assistant.answer', prompt, config.answerModel, progress?.delta);
    llmAnswer = (result.text || '').trim();
  } catch (e: any) {
    threw = String(e?.message || e);
  }
  progress?.stage(llmAnswer ? '✅ Ответ сформирован' : '⚠️ Claude не вернул ответ');
  // Лог запроса к LLM (показывается в Истории) — движок, модель, исход, ответ.
  const mkLog = (outcome: string) => [
    `engine: ${result?.engine || 'none'}`,
    `model: ${config.answerModel}`,
    `prompt: ${prompt.length} chars${graphCtx ? ' (+ graph context)' : ''}, evidence sources: ${hits.length}`,
    `outcome: ${outcome}`,
    '--- engine log ---',
    (result?.diag?.join('\n') || threw || 'no diagnostics'),
    llmAnswer ? `--- LLM answer (${llmAnswer.length} chars, first 2000) ---\n${llmAnswer.slice(0, 2000)}` : '',
  ].filter(Boolean).join('\n');

  // Агрегатор токенов по сделанным LLM-вызовам (для usage-аналитики/лимитов в админке).
  const tokOf = (...rs: Array<Awaited<ReturnType<typeof runRolePrompt>> | undefined>) => {
    const arr = rs.filter(Boolean) as Array<Awaited<ReturnType<typeof runRolePrompt>>>;
    const pt = arr.reduce((s, r) => s + (r.promptTokens || 0), 0);
    const ct = arr.reduce((s, r) => s + (r.completionTokens || 0), 0);
    const total = pt + ct;
    const model = arr.find((r) => r.model)?.model || config.answerModel;
    return { promptTokens: pt || undefined, completionTokens: ct || undefined, totalTokens: total || undefined, model };
  };

  // Грунтованный ответ от LLM (по документации) — основной путь. Граф добавляем дополнением.
  if (llmAnswer && !looksInsufficient(llmAnswer)) {
    // Идём в код, если ответ «упирается в код», ИЛИ это вопрос «где/как сделать в
    // продукте», а грунт-ответ не дал конкретного места в UI (нужна ссылка/экран).
    const navGap = needsUi(question) && answerUncertain(llmAnswer);
    if (result?.engine === 'claude' && (needsCode(llmAnswer) || navGap)) {
      progress?.stage(navGap ? '🖥 Нужно место в интерфейсе — ищу в коде фронта…' : '🧩 Ответ упирается в код — открываю исходники…');
      try {
        const cd = await codeDive(question, `${llmAnswer}\n\n${evidence}`, lang, progress);
        if (cd) {
          const answer = graphCtx ? `${cd.answer}\n\n---\n\n${formatGraphAnswer(graphCtx, lang)}` : cd.answer;
          return { mode: 'llm', answer, usedGraph, llmLog: mkLog(`code-dive used: ${cd.files.join(', ')}`), ...tokOf(result, cd.result) };
        }
      } catch { /* fall back to the doc answer */ }
    }
    const answer = graphCtx ? `${llmAnswer}\n\n---\n\n${formatGraphAnswer(graphCtx, lang)}` : llmAnswer;
    return { mode: 'llm', answer, usedGraph, llmLog: mkLog('LLM answer used' + (graphCtx ? ' + graph appended' : '')), ...tokOf(result) };
  }

  // Документация не дала ответа, но Claude доступен → сперва пробуем ПОЧИТАТЬ КОД (авторитетно),
  // и только если кода нет — режим «Додумывания».
  if (result?.engine === 'claude') {
    progress?.stage('🧩 В доке ответа нет — открываю исходный код…');
    try {
      const cd = await codeDive(question, `${llmAnswer}\n\n${evidence}`, lang, progress);
      if (cd) {
        const answer = graphCtx ? `${cd.answer}\n\n---\n\n${formatGraphAnswer(graphCtx, lang)}` : cd.answer;
        return { mode: 'llm', answer, usedGraph, llmLog: mkLog(`code-dive used (doc answer insufficient): ${cd.files.join(', ')}`), ...tokOf(result, cd.result) };
      }
    } catch { /* fall through to speculative */ }
  }

  // РЕЖИМ «ДОДУМЫВАНИЯ»: точного ответа в документации нет, но Claude доступен →
  // второй проход с РАСШИРЕННЫМ контекстом (все хиты целиком + код-рефы графа) и
  // разрешением на обоснованное предположение, с ОБЯЗАТЕЛЬНОЙ пометкой.
  if (result?.engine === 'claude' && allowSpeculative) {
    progress?.stage('🔎 Глубокий поиск + режим додумывания…');
    const deepEvidence = hits
      .slice(0, 8)
      .map((hit, i) => {
        const full = textByPath.get(hit.path);
        const ex = full ? buildEvidence(full, evTerms) : (hit.evidence || hit.snippet);
        return `Source ${i + 1}\ntitle: ${hit.title}\npath: ${hit.path}\nexcerpt: ${ex}`;
      })
      .join('\n\n');
    const deepPrompt = `You are a senior Shiptify engineer. The documentation does NOT directly answer the question.
Give the MOST LIKELY answer by REASONING from the general logic of the application and the broad evidence below
(specs, docs, code references, knowledge graph). You MAY infer, but mark uncertainty and never fabricate exact
identifiers (API paths, DB columns, flags) that are not in the evidence — if you infer them, say "(предположительно)".
Respond in language: ${lang}. Be concrete and useful for a support engineer. Start directly with the answer
(the system prepends a disclaimer). End with a "Sources:" line.

Question:
${question}

${graphCtx ? `ГРАФ ЗНАНИЙ:\n${graphCtx}\n\n` : ''}Broad evidence:
${deepEvidence}`;
    let deep = '';
    let r2: Awaited<ReturnType<typeof runRolePrompt>> | undefined;
    try {
      r2 = await runRolePrompt('knowledge_assistant.answer_speculative', deepPrompt, config.answerModel, progress?.delta);
      deep = (r2.text || '').trim();
    } catch { /* ignore */ }
    if (deep) {
      const answer = `${copy.speculativeNotice[lang]}\n\n${deep}${graphCtx ? `\n\n---\n\n${formatGraphAnswer(graphCtx, lang)}` : ''}`;
      return { mode: 'speculative', answer, usedGraph, llmLog: mkLog(`deep/speculative mode (${deep.length} chars)`), ...tokOf(result, r2) };
    }
  }

  // Claude CLI недоступен (нет авторизации/связи) — явное сообщение + граф как «сырые» данные.
  const notice = copy.llmUnavailable[lang];
  if (graphCtx) {
    return {
      mode: 'fallback',
      answer: `${notice}\n\n---\n\n${formatGraphAnswer(graphCtx, lang)}`,
      fallbackKind: 'generic',
      usedGraph: true,
      llmLog: mkLog('Claude CLI unavailable → notice + graph data'),
      ...tokOf(result),
    };
  }
  return { mode: 'fallback', answer: notice, fallbackKind: 'generic', usedGraph, llmLog: mkLog('Claude CLI unavailable → notice (no graph)'), ...tokOf(result) };
}

// Превращает структурный блок графа в чистый markdown-ответ (без LLM).
function formatGraphAnswer(block: string, lang: string): string {
  const intro = lang === 'en' ? 'From the knowledge graph:' : lang === 'fr' ? 'Depuis le graphe de connaissances :' : 'По графу знаний:';
  const out: string[] = [intro, ''];
  for (const section of block.split('\n\n')) {
    const lines = section.split('\n');
    const head = (lines[0] || '').replace(/:$/, '').trim();
    if (head) out.push(`### ${head}`);
    for (const ln of lines.slice(1)) {
      const m = ln.match(/^\s*(.+?)\s*\((\d+)\):\s*(.+)$/);
      if (m) out.push(`- **${m[1]} (${m[2]}):** ${m[3]}`);
      else if (ln.trim()) out.push(ln.trim());
    }
    out.push('');
  }
  out.push(lang === 'en' ? '_Detailed sources below._' : lang === 'fr' ? '_Sources détaillées ci-dessous._' : '_Подробные источники — ниже._');
  return out.join('\n');
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
    languageHint: z.enum(['ru', 'en', 'fr']).optional(),
    inputMode: z.enum(['text', 'voice']).default('text'),
    allowSpeculative: z.boolean().optional().default(true), // режим «Додумывания» при пустом ответе
    images: z.array(z.string().min(1).max(300)).max(20).optional(), // ключи изображений в MinIO (до 20)
  });

  // Загрузка изображения к вопросу (multipart, поле "image") → MinIO → ключ.
  app.post('/api/knowledge/upload-image', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    if (!storageReady()) return reply.code(503).send({ error: 'Хранилище изображений недоступно' });
    if (!req.isMultipart()) return reply.code(415).send({ error: 'Ожидается multipart/form-data' });
    try {
      for await (const part of req.parts()) {
        if (part.type === 'file' && part.fieldname === 'image') {
          const buf = await part.toBuffer();
          if (buf.length > 10 * 1024 * 1024) return reply.code(413).send({ error: 'Изображение больше 10MB' });
          const saved = await putImage(buf, part.mimetype, user.id);
          return reply.code(201).send({ key: saved.key, mime: saved.mime });
        }
      }
      return reply.code(400).send({ error: 'Файл не найден (поле: image)' });
    } catch (e: any) {
      return reply.code(400).send({ error: String(e?.message || e).slice(0, 200) });
    }
  });

  // Vision-контекст: тянет изображения из MinIO и прогоняет через Claude vision.
  async function imageContext(images: string[] | undefined, question: string, onStage?: (m: string) => void): Promise<string> {
    if (!images || !images.length || !storageReady()) return '';
    try {
      onStage?.('🖼 Анализ приложенного изображения…');
      const loaded: Array<{ buffer: Buffer; mime: string }> = [];
      for (const key of images.slice(0, 20)) { try { loaded.push(await getImage(key)); } catch { /* skip */ } }
      if (!loaded.length) return '';
      const r = await analyzeImages(loaded, question, config.answerModel);
      return (r.text || '').trim();
    } catch { return ''; }
  }

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
    const imgCtx = await imageContext(parsed.data.images, parsed.data.question);
    const qForEngine = imgCtx ? `${parsed.data.question}\n\n[Контекст из приложенного изображения]:\n${imgCtx}` : parsed.data.question;
    const language = normalizeAnswerLanguage(parsed.data.languageHint || detectQuestionLanguage(parsed.data.question));
    const { hits, terms, suggestion, plan, profile } = await searchKnowledge(qForEngine, parsed.data.languageHint);
    const intent = plan.intent || inferIntent(parsed.data.question);
    const composed = await composeAnswer(qForEngine, hits, language, plan, profile, undefined, parsed.data.allowSpeculative);
    const latencyMs = Date.now() - started;
    let confidence = confidenceFromHits(hits, terms.length, profile, composed.mode, composed.fallbackKind);
    // Ответ, построенный по графу знаний, — структурно достоверен: не занижаем уверенность.
    if (composed.usedGraph && composed.mode === 'llm') confidence = Math.max(confidence, 0.8);

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
        llmLog: composed.llmLog || null,
        intent,
        confidence,
        latencyMs,
        sourceCount: hits.length,
        promptTokens: composed.promptTokens ?? null,
        completionTokens: composed.completionTokens ?? null,
        totalTokens: composed.totalTokens ?? null,
        llmModel: composed.model ?? null,
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
      llmLog: composed.llmLog || null,
      intent,
      confidence,
      latencyMs,
      language,
      suggestion,
      retrievalPlan: {
        normalizedQuestion: plan.normalizedQuestion,
        intent: plan.intent,
        answerStyle: plan.answerStyle,
        entities: plan.entities,
        searchQueries: plan.searchQueries,
      },
      sources: hits,
    });
  });

  // Стрим-версия /ask (SSE): отдаёт прогресс-стадии и текст ответа по мере генерации,
  // чтобы во фронте была «живая» динамика, а не глухой лоадер. Финал — событие `done`
  // с той же полезной нагрузкой, что и у /api/knowledge/ask.
  app.post('/api/knowledge/ask/stream', async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;

    const parsed = askSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const send = (event: string, data: any) => {
      try { raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* client gone */ }
    };
    // keep-alive пинг, чтобы прокси не рвал соединение во время долгой генерации
    const ping = setInterval(() => { try { raw.write(': ping\n\n'); } catch { /* noop */ } }, 15000);

    try {
      send('stage', { msg: '🔎 Поиск по документам и графу…' });
      const started = Date.now();
      const imgCtx = await imageContext(parsed.data.images, parsed.data.question, (m) => send('stage', { msg: m }));
      const qForEngine = imgCtx ? `${parsed.data.question}\n\n[Контекст из приложенного изображения]:\n${imgCtx}` : parsed.data.question;
      const language = normalizeAnswerLanguage(parsed.data.languageHint || detectQuestionLanguage(parsed.data.question));
      const { hits, terms, suggestion, plan, profile } = await searchKnowledge(qForEngine, parsed.data.languageHint);
      const intent = plan.intent || inferIntent(parsed.data.question);
      send('stage', { msg: `📚 Источников найдено: ${hits.length}` });

      const progress = {
        stage: (msg: string) => send('stage', { msg }),
        delta: (text: string) => send('delta', { text }),
      };
      const composed = await composeAnswer(qForEngine, hits, language, plan, profile, progress, parsed.data.allowSpeculative);
      const latencyMs = Date.now() - started;
      let confidence = confidenceFromHits(hits, terms.length, profile, composed.mode, composed.fallbackKind);
      if (composed.usedGraph && composed.mode === 'llm') confidence = Math.max(confidence, 0.8);

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
          llmLog: composed.llmLog || null,
          intent,
          confidence,
          latencyMs,
          sourceCount: hits.length,
          promptTokens: composed.promptTokens ?? null,
          completionTokens: composed.completionTokens ?? null,
          totalTokens: composed.totalTokens ?? null,
          llmModel: composed.model ?? null,
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

      send('done', {
        queryId: saved.id,
        answer: composed.answer,
        llmLog: composed.llmLog || null,
        intent,
        confidence,
        latencyMs,
        language,
        suggestion,
        retrievalPlan: {
          normalizedQuestion: plan.normalizedQuestion,
          intent: plan.intent,
          answerStyle: plan.answerStyle,
          entities: plan.entities,
          searchQueries: plan.searchQueries,
        },
        sources: hits,
      });
    } catch (e: any) {
      send('error', { message: String(e?.message || e).slice(0, 300) });
    } finally {
      clearInterval(ping);
      try { raw.end(); } catch { /* noop */ }
    }
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

  // Ссылка на ответ: любой авторизованный пользователь может открыть готовый ответ по id.
  app.get('/api/knowledge/answer/:id', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const q = await prisma.knowledgeQuery.findUnique({ where: { id: String(req.params.id) } });
    if (!q) return reply.code(404).send({ error: 'Ответ не найден' });
    return reply.send({
      queryId: q.id,
      question: q.question,
      answer: q.answer,
      answerMode: q.answerMode,
      llmLog: q.llmLog || null,
      intent: q.intent,
      confidence: q.confidence,
      latencyMs: q.latencyMs,
      sources: (q.sources as any) || [],
      author: q.userLabel || null,
      createdAt: q.createdAt,
    });
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
    if (query.userId && query.userId !== user.id && user.role !== 'admin') {
      return reply.code(403).send({ error: 'Cannot leave feedback for another user\'s query' });
    }

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

  // Correction proposed by the user for the received answer. Structured capture
  // (master spec §8): what was wrong, the corrected knowledge, and the topic.
  const correctionSchema = z.object({
    text: z.string().min(1).max(8000),
    whatWrong: z.string().max(4000).optional(),
    corrected: z.string().max(8000).optional(),
    topic: z.string().max(300).optional(),
    kind: z.enum(['text', 'voice']).default('text'),
  });

  app.post('/api/knowledge/queries/:id/correction', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;

    const parsed = correctionSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const query = await prisma.knowledgeQuery.findUnique({ where: { id: String(req.params.id) } });
    if (!query) return reply.code(404).send({ error: 'Query not found' });
    if (query.userId && query.userId !== user.id && user.role !== 'admin') {
      return reply.code(403).send({ error: 'Cannot correct another user\'s query' });
    }

    const correction = await prisma.knowledgeCorrection.create({
      data: {
        queryId: query.id,
        userId: user.id,
        kind: parsed.data.kind,
        text: parsed.data.text,
        whatWrong: parsed.data.whatWrong,
        corrected: parsed.data.corrected,
        topic: parsed.data.topic || deriveTopic(query.question, queryTerms(query.question)),
      },
    });

    return reply.code(201).send({ ok: true, correctionId: correction.id });
  });

  // Server-side speech-to-text (Whisper). Manual-stop recordings are uploaded
  // here; the transcript is returned for the user to edit before sending.
  app.post('/api/knowledge/transcribe', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    if (!req.isMultipart || !req.isMultipart()) {
      return reply.code(415).send({ error: 'Expected multipart/form-data with an "audio" file' });
    }

    let audioBuffer: Buffer | undefined;
    let audioFilename = 'audio.webm';
    let languageHint: string | undefined;
    for await (const part of req.parts()) {
      if (part.type === 'file' && part.fieldname === 'audio') {
        audioFilename = part.filename || audioFilename;
        audioBuffer = await part.toBuffer();
      } else if (part.type === 'field' && part.fieldname === 'language') {
        languageHint = String(part.value || '') || undefined;
      }
    }
    if (!audioBuffer || !audioBuffer.length) {
      return reply.code(400).send({ error: 'audio file is required (field name: audio)' });
    }

    const dir = path.resolve(process.cwd(), 'data', 'stt');
    await fs.mkdir(dir, { recursive: true });
    const ext = path.extname(audioFilename) || '.webm';
    const dest = path.join(dir, `${Date.now()}-${Math.round(audioBuffer.length)}${ext}`);
    await fs.writeFile(dest, audioBuffer);

    try {
      const result = await transcribeAudioFile(dest, languageHint);
      return reply.send({ text: result.text, language: result.language, model: result.model });
    } catch (e: any) {
      return reply.code(e.statusCode || 502).send({ error: e.message || 'Transcription failed' });
    } finally {
      await fs.unlink(dest).catch(() => {});
    }
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
        answerMode: row.answerMode,
        llmLog: row.llmLog || null,
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
        latencyMs: row.latencyMs,
        promptTokens: row.promptTokens,
        completionTokens: row.completionTokens,
        totalTokens: row.totalTokens,
        llmModel: row.llmModel,
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
          whatWrong: c.whatWrong,
          corrected: c.corrected,
          topic: c.topic,
          status: c.status,
          createdAt: c.createdAt,
        })),
      })),
    });
  });

  // Usage по токенам — агрегаты по окнам + разбивка по модели (для оценки лимитов).
  app.get('/api/admin/knowledge/usage', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;
    const now = Date.now();
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const windowAgg = async (from: Date | null) => {
      const r = await prisma.knowledgeQuery.aggregate({
        where: from ? { createdAt: { gte: from } } : {},
        _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
        _count: { _all: true },
        _avg: { totalTokens: true },
      });
      return {
        queries: r._count._all,
        totalTokens: r._sum.totalTokens || 0,
        promptTokens: r._sum.promptTokens || 0,
        completionTokens: r._sum.completionTokens || 0,
        avgTokens: Math.round(r._avg.totalTokens || 0),
      };
    };
    const [today, last7d, last30d, allTime] = await Promise.all([
      windowAgg(startOfToday),
      windowAgg(new Date(now - 7 * 864e5)),
      windowAgg(new Date(now - 30 * 864e5)),
      windowAgg(null),
    ]);
    const byModelRaw = await prisma.knowledgeQuery.groupBy({
      by: ['llmModel'],
      _sum: { totalTokens: true },
      _count: { _all: true },
      where: { totalTokens: { not: null } },
    });
    const byModel = byModelRaw
      .map((m: any) => ({ model: m.llmModel || '—', totalTokens: m._sum.totalTokens || 0, queries: m._count._all }))
      .sort((a: any, b: any) => b.totalTokens - a.totalTokens);
    return reply.send({ today, last7d, last30d, allTime, byModel });
  });

  app.get('/api/admin/knowledge/analytics', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;
    return reply.send(await buildAnalytics());
  });

  // --- Correction review / apply workflow (master spec §8, Phase 3) ---

  app.get('/api/admin/knowledge/corrections', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const status = req.query?.status ? String(req.query.status) : undefined;
    const rows = await prisma.knowledgeCorrection.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        user: { select: { name: true, email: true } },
        query: { select: { question: true, answer: true } },
      },
    });

    return reply.send({
      corrections: rows.map((c: any) => ({
        id: c.id,
        status: c.status,
        kind: c.kind,
        text: c.text,
        whatWrong: c.whatWrong,
        corrected: c.corrected,
        topic: c.topic,
        appliedAt: c.appliedAt,
        appliedEntryId: c.appliedEntryId,
        createdAt: c.createdAt,
        author: c.user ? { name: c.user.name, email: c.user.email } : null,
        question: c.query?.question,
        answer: c.query?.answer,
      })),
    });
  });

  // Apply a correction: write the corrected knowledge into the operational
  // store (KnowledgeEntry) so later answers are grounded on the corrected truth.
  const applyCorrectionSchema = z.object({
    title: z.string().min(3).max(300).optional(),
    body: z.string().min(3).max(20000).optional(),
    topic: z.string().max(300).optional(),
    entityId: z.string().optional(),
  });

  app.post('/api/admin/knowledge/corrections/:id/apply', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const parsed = applyCorrectionSchema.safeParse(req.body || {});
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const correction = await prisma.knowledgeCorrection.findUnique({
      where: { id: String(req.params.id) },
      include: { query: true },
    });
    if (!correction) return reply.code(404).send({ error: 'Correction not found' });
    if (correction.status === 'APPLIED') return reply.code(409).send({ error: 'Already applied' });

    const topic = parsed.data.topic || correction.topic || deriveTopic(correction.query.question, queryTerms(correction.query.question));
    const title = parsed.data.title || `Correction: ${topic}`.slice(0, 280);
    const body = parsed.data.body
      || correction.corrected
      || [
        `Question: ${correction.query.question}`,
        correction.whatWrong ? `What was wrong: ${correction.whatWrong}` : '',
        `Correction: ${correction.text}`,
      ].filter(Boolean).join('\n');

    const entry = await prisma.knowledgeEntry.create({
      data: {
        title,
        body,
        topic,
        sourceType: 'correction',
        origin: 'correction',
        status: 'APPROVED',
        correctionId: correction.id,
        createdById: admin.id,
        entityId: parsed.data.entityId || undefined,
      },
    });

    await prisma.knowledgeCorrection.update({
      where: { id: correction.id },
      data: { status: 'APPLIED', appliedAt: new Date(), appliedEntryId: entry.id, reviewedById: admin.id },
    });

    // Force a re-index so the new entry is immediately searchable.
    await loadKnowledgeDocs(true);

    return reply.send({ ok: true, entryId: entry.id });
  });

  app.post('/api/admin/knowledge/corrections/:id/reject', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;
    const correction = await prisma.knowledgeCorrection.findUnique({ where: { id: String(req.params.id) } });
    if (!correction) return reply.code(404).send({ error: 'Correction not found' });
    await prisma.knowledgeCorrection.update({
      where: { id: correction.id },
      data: { status: 'REJECTED', reviewedById: admin.id },
    });
    return reply.send({ ok: true });
  });

  // --- Graph + traceability (master spec §10/§11/§12) ---

  // Public-ish (authed) graph data for the visualization page.
  app.get('/api/knowledge/graph', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;

    const [entities, relations] = await Promise.all([
      prisma.knowledgeEntity.findMany({
        where: { type: { not: '_meta' } },
        orderBy: { type: 'asc' },
        include: { _count: { select: { entries: true } } },
      }),
      prisma.knowledgeRelation.findMany(),
    ]);

    return reply.send({
      nodes: entities.map((e: any) => {
        const m = (e.metadata || {}) as any;
        // Спека — отдельный тип-слой в графе (документ с docType: spec), узел трассировки.
        const isSpec = m.docType === 'spec';
        return {
          id: e.id,
          name: e.name,
          type: isSpec ? 'spec' : e.type,
          docType: m.docType || null,
          summary: e.summary,
          entryCount: e._count.entries,
          domain: m.domain || null,
          status: m.status || null,
          route: m.route || null,
          kind: m.kind || null,
          codeRefs: typeof m.codeRefs === 'number' ? m.codeRefs : null,
          confluence: m.confluence || null,
          url: m.url || null,
        };
      }),
      edges: relations.map((r: any) => ({ id: r.id, from: r.fromId, to: r.toId, type: r.type })),
    });
  });

  const createEntitySchema = z.object({
    name: z.string().min(1).max(200),
    type: z.string().min(1).max(60),
    summary: z.string().max(2000).optional(),
  });

  app.post('/api/admin/knowledge/entities', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;
    const parsed = createEntitySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const entity = await prisma.knowledgeEntity.upsert({
      where: { type_name: { type: parsed.data.type, name: parsed.data.name } },
      update: { summary: parsed.data.summary },
      create: { name: parsed.data.name, type: parsed.data.type, summary: parsed.data.summary },
    });
    return reply.code(201).send({ entity });
  });

  const createRelationSchema = z.object({
    fromId: z.string().min(1),
    toId: z.string().min(1),
    type: z.string().min(1).max(60),
  });

  app.post('/api/admin/knowledge/relations', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;
    const parsed = createRelationSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const relation = await prisma.knowledgeRelation.upsert({
      where: { fromId_toId_type: { fromId: parsed.data.fromId, toId: parsed.data.toId, type: parsed.data.type } },
      update: {},
      create: parsed.data,
    });
    return reply.code(201).send({ relation });
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
        reason: gap.reason,
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

// Idempotently seed a small knowledge graph so the graph view and traceability
// have content out of the box. Mirrors the seeded knowledge-base documents.
export async function seedKnowledgeGraph() {
  const entities: Array<{ type: string; name: string; summary: string }> = [
    { type: 'module', name: 'TMS', summary: 'Transport Management System — core platform.' },
    { type: 'feature', name: 'Carrier Types', summary: 'Carrier type registry and onboarding.' },
    { type: 'module', name: 'Billing Engine', summary: 'Rating & billing rules keyed by carrier type.' },
    { type: 'api', name: 'Booking API', summary: 'Validates carrier type on inbound bookings.' },
    { type: 'requirement', name: 'Roles and Permissions', summary: 'Authoritative roles & permission matrix.' },
    { type: 'process', name: 'Production Deployment', summary: 'Deploy / rollback / incident runbook.' },
    { type: 'document', name: 'Confluence', summary: 'Primary documentation source.' },
  ];

  try {
    const byName: Record<string, string> = {};
    for (const e of entities) {
      const row = await prisma.knowledgeEntity.upsert({
        where: { type_name: { type: e.type, name: e.name } },
        update: { summary: e.summary },
        create: e,
      });
      byName[e.name] = row.id;
    }

    const relations: Array<[string, string, string]> = [
      ['Carrier Types', 'TMS', 'part_of'],
      ['Carrier Types', 'Billing Engine', 'depends_on'],
      ['Booking API', 'Carrier Types', 'uses'],
      ['Billing Engine', 'Confluence', 'documented_by'],
      ['Roles and Permissions', 'Confluence', 'documented_by'],
      ['Production Deployment', 'TMS', 'relates_to'],
    ];
    for (const [from, to, type] of relations) {
      if (!byName[from] || !byName[to]) continue;
      await prisma.knowledgeRelation.upsert({
        where: { fromId_toId_type: { fromId: byName[from], toId: byName[to], type } },
        update: {},
        create: { fromId: byName[from], toId: byName[to], type },
      });
    }
  } catch {
    // No DB available — skip seeding silently.
  }
}
