import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from './config.js';
import { runRolePrompt, transcribeAudioFile } from './llm.js';
import { requireAuth } from './auth.js';
import { getImage, storageReady } from './storage.js';
import { logFeatureUsage } from './usage.js';

// ---------------------------------------------------------------------------
// Bugs section: turn a free-form (typed or voice) defect description into a
// well-structured Jira bug — analyse against existing bugs (dedup), produce an
// English, copy-ready preview (Preconditions → Steps → Expected → Actual →
// Screenshots → context), let the user edit it, then file it in Jira.
// Jira config via env: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN,
// JIRA_DEFAULT_PROJECT (default TMS). No SDK — Jira Cloud REST v2 over fetch.
// ---------------------------------------------------------------------------
function jiraConfig() {
  const baseUrl = String(process.env.JIRA_BASE_URL || 'https://shiptify.atlassian.net').replace(/\/$/, '');
  const email = String(process.env.JIRA_EMAIL || '').trim();
  const token = String(process.env.JIRA_API_TOKEN || '').trim();
  const defaultProject = String(process.env.JIRA_DEFAULT_PROJECT || 'TMS').trim();
  return { baseUrl, email, token, defaultProject, enabled: !!(baseUrl && email && token) };
}
function jiraAuthHeader() {
  const { email, token } = jiraConfig();
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
}
async function jiraFetch(method: string, apiPath: string, body?: any) {
  const { baseUrl } = jiraConfig();
  const res = await fetch(`${baseUrl}${apiPath}`, {
    method,
    headers: { Authorization: jiraAuthHeader(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  if (!res.ok) {
    const msg = json?.errorMessages?.join('; ') || (json?.errors && JSON.stringify(json.errors)) || text.slice(0, 300);
    throw new Error(`Jira ${res.status}: ${msg}`);
  }
  return json;
}

// Projects that have a Bug issue type (for the project picker).
async function listBugProjects(): Promise<Array<{ key: string; name: string }>> {
  const data = await jiraFetch('GET', '/rest/api/2/project/search?expand=issueTypes&maxResults=50');
  const out: Array<{ key: string; name: string }> = [];
  for (const p of data?.values || []) {
    if ((p.issueTypes || []).some((t: any) => /^bug$/i.test(t.name))) out.push({ key: p.key, name: p.name });
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

// Existing bugs that might match — used for dedup analysis by the LLM.
async function searchExistingBugs(projectKey: string, keywords: string[]): Promise<Array<{ key: string; summary: string; status: string; url: string }>> {
  const { baseUrl } = jiraConfig();
  const kw = keywords.filter(Boolean).slice(0, 8).map((k) => k.replace(/["\\]/g, ' ').trim()).filter((k) => k.length > 2);
  const textClause = kw.length ? ` AND text ~ ${JSON.stringify(kw.join(' '))}` : '';
  const jql = `project = ${JSON.stringify(projectKey)} AND issuetype = Bug${textClause} ORDER BY updated DESC`;
  let data: any;
  try {
    data = await jiraFetch('GET', `/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,status&maxResults=30`);
  } catch {
    // fall back to recent bugs without text filter if the text query is rejected
    const jql2 = `project = ${JSON.stringify(projectKey)} AND issuetype = Bug ORDER BY updated DESC`;
    data = await jiraFetch('GET', `/rest/api/2/search?jql=${encodeURIComponent(jql2)}&fields=summary,status&maxResults=30`);
  }
  return (data?.issues || []).map((i: any) => ({
    key: i.key,
    summary: i.fields?.summary || '',
    status: i.fields?.status?.name || '',
    url: `${baseUrl}/browse/${i.key}`,
  }));
}

const STOP = new Set(['this','that','with','from','have','when','then','there','here','what','which','about','into','will','would','could','should','доступ','когда','почему','после','через','нет','есть','при','для','что','как','это','的','the','and','for','not','but','was','are','can','does','did']);
function extractKeywords(text: string): string[] {
  const freq = new Map<string, number>();
  for (const raw of String(text).toLowerCase().match(/[a-zа-я0-9_./-]{3,}/gi) || []) {
    const w = raw.trim();
    if (STOP.has(w) || w.length < 3) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 10);
}

function parseJsonLoose(s: string): any {
  let t = String(s || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const a = t.indexOf('{'); const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

async function analyzeBug(rawText: string, projectKey: string, candidates: Array<{ key: string; summary: string; status: string }>) {
  const candidateList = candidates.length
    ? candidates.map((c) => `- ${c.key} [${c.status}]: ${c.summary}`).join('\n')
    : '(no existing bugs returned by search)';
  const prompt = `You are a senior QA engineer at Shiptify (a TMS/logistics SaaS). Turn the raw defect note below into a clean, copy-ready Jira bug, IN ENGLISH (translate if the note is in another language).

Also decide whether this is ALREADY a known defect by comparing against the existing bugs listed.

Return ONLY a JSON object (no prose, no code fences) with this exact shape:
{
  "summary": "concise one-line bug title (English, <=120 chars)",
  "priority": "Highest|High|Medium|Low|Lowest",
  "severity": "Blocker|Critical|Major|Minor|Trivial",
  "area": "best-guess product area/module (e.g. Tracking, Dock, Invoicing, Public API)",
  "labels": ["lowercase-no-spaces", "..."],
  "descriptionWiki": "Jira wiki-markup body. MUST follow EXACTLY this section order:\\n\\nh3. Preconditions\\n...\\n\\nh3. Steps to Reproduce\\n# step one\\n# step two\\n\\nh3. Expected Result\\n...\\n\\nh3. Actual Result\\n...\\n\\nh3. Screenshots\\n(note attached screenshots, or 'N/A')\\n\\nh3. Additional Context & Evidence\\n... (logs, IDs, environment, reasoning, anything else — this 'water' goes LAST)",
  "duplicate": {
    "isKnown": true|false,
    "matches": [{"key":"TMS-123","reason":"why it matches; or note it may just be different reproduction steps of the same defect","similarity":"high|medium|low"}],
    "recommendation": "short guidance: file new / add as comment to <KEY> / likely duplicate of <KEY>"
  }
}

Rules:
- The 'суть' (Preconditions, Steps, Expected, Actual, Screenshots) comes FIRST; the explanatory 'water' and evidence go in 'Additional Context & Evidence' LAST.
- Be concrete and reproducible. If a detail is missing, write a sensible placeholder like "(to be confirmed)" rather than inventing specifics.
- If an existing bug looks like the same defect (even with different reproduction steps), set isKnown=true and reference its key.
- labels: short, kebab/lower, e.g. ["tracking","public-api"].

Existing bugs in project ${projectKey}:
${candidateList}

Raw defect note:
${rawText}`;

  const r = await runRolePrompt('qa.bug_writer', prompt, config.answerModel);
  if (!r.text || !r.text.trim()) throw new Error('LLM returned no analysis');
  const parsed = parseJsonLoose(r.text);
  return { parsed, tokens: r.totalTokens || null, promptTokens: r.promptTokens || null, completionTokens: r.completionTokens || null, model: r.model };
}

// Attach screenshots (already uploaded to MinIO) to a created Jira issue.
async function attachImagesToIssue(issueKey: string, imageKeys: string[]) {
  if (!imageKeys?.length || !storageReady()) return 0;
  const { baseUrl } = jiraConfig();
  let attached = 0;
  for (const key of imageKeys.slice(0, 20)) {
    try {
      const img = await getImage(key);
      const form = new FormData();
      const ext = (img.mime.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '');
      form.append('file', new Blob([new Uint8Array(img.buffer)], { type: img.mime }), `screenshot-${attached + 1}.${ext}`);
      const res = await fetch(`${baseUrl}/rest/api/2/issue/${issueKey}/attachments`, {
        method: 'POST',
        headers: { Authorization: jiraAuthHeader(), 'X-Atlassian-Token': 'no-check' },
        body: form,
      });
      if (res.ok) attached += 1;
    } catch { /* skip a failed attachment */ }
  }
  return attached;
}

export async function registerBugsApi(app: FastifyInstance) {
  // Config + project list for the UI.
  app.get('/api/bugs/config', async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const cfg = jiraConfig();
    if (!cfg.enabled) return reply.send({ enabled: false, defaultProject: cfg.defaultProject, projects: [] });
    let projects: Array<{ key: string; name: string }> = [];
    try { projects = await listBugProjects(); } catch { /* ignore — still allow default */ }
    return reply.send({ enabled: true, defaultProject: cfg.defaultProject, projects });
  });

  // Voice → text (any language). The bug itself is assembled in English by /analyze.
  app.post('/api/bugs/transcribe', async (req: any, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    if (!req.isMultipart()) return reply.code(415).send({ error: 'multipart/form-data expected' });
    let tmp = '';
    try {
      for await (const part of req.parts()) {
        if (part.type === 'file' && part.fieldname === 'audio') {
          const buf = await part.toBuffer();
          if (buf.length > 25 * 1024 * 1024) return reply.code(413).send({ error: 'Audio larger than 25MB' });
          tmp = path.join(os.tmpdir(), `bug-voice-${Date.now()}.webm`);
          await fs.promises.writeFile(tmp, buf);
          const tr = await transcribeAudioFile(tmp);
          return reply.send({ text: tr.text, language: tr.language });
        }
      }
      return reply.code(400).send({ error: 'No audio file (field: audio)' });
    } catch (e: any) {
      return reply.code(400).send({ error: String(e?.message || e).slice(0, 250) });
    } finally {
      if (tmp) { try { await fs.promises.unlink(tmp); } catch { /* noop */ } }
    }
  });

  const analyzeSchema = z.object({
    description: z.string().min(5),
    project: z.string().min(1).max(20).optional(),
  });

  // Analyse: dedup against existing Jira bugs + build the structured English preview.
  app.post('/api/bugs/analyze', async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const cfg = jiraConfig();
    if (!cfg.enabled) return reply.code(503).send({ error: 'Jira is not configured (JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN)' });
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const project = (parsed.data.project || cfg.defaultProject).toUpperCase();

    let candidates: Array<{ key: string; summary: string; status: string; url: string }> = [];
    try { candidates = await searchExistingBugs(project, extractKeywords(parsed.data.description)); } catch { /* dedup is best-effort */ }

    let analysis;
    try {
      analysis = await analyzeBug(parsed.data.description, project, candidates);
    } catch (e: any) {
      return reply.code(502).send({ error: `Analysis failed: ${String(e?.message || e).slice(0, 200)}` });
    }
    const p = analysis.parsed || {};
    await logFeatureUsage({
      userId: user.id, userLabel: user.name, feature: 'bugs', action: 'analyze', ref: p.summary || parsed.data.description.slice(0, 120),
      model: analysis.model, promptTokens: analysis.promptTokens, completionTokens: analysis.completionTokens, totalTokens: analysis.tokens,
    });
    // enrich duplicate matches with URLs from the candidate set
    const byKey = new Map(candidates.map((c) => [c.key, c]));
    const matches = (p.duplicate?.matches || []).map((m: any) => ({
      key: m.key, reason: m.reason, similarity: m.similarity,
      summary: byKey.get(m.key)?.summary || null,
      url: byKey.get(m.key)?.url || `${cfg.baseUrl}/browse/${m.key}`,
    }));
    return reply.send({
      project,
      preview: {
        summary: p.summary || '',
        priority: p.priority || 'Medium',
        severity: p.severity || 'Major',
        area: p.area || '',
        labels: Array.isArray(p.labels) ? p.labels : [],
        descriptionWiki: p.descriptionWiki || '',
      },
      duplicate: { isKnown: !!p.duplicate?.isKnown, matches, recommendation: p.duplicate?.recommendation || '' },
      candidatesCount: candidates.length,
      model: analysis.model,
      tokens: analysis.tokens,
    });
  });

  const createSchema = z.object({
    project: z.string().min(1).max(20),
    summary: z.string().min(3).max(255),
    descriptionWiki: z.string().min(1),
    priority: z.string().max(20).optional(),
    labels: z.array(z.string().max(60)).max(20).optional(),
    images: z.array(z.string().min(1).max(300)).max(20).optional(),
  });

  // Create the defect in Jira from the (edited) preview.
  app.post('/api/bugs/create', async (req, reply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    const cfg = jiraConfig();
    if (!cfg.enabled) return reply.code(503).send({ error: 'Jira is not configured' });
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const d = parsed.data;

    const fullFields: any = {
      project: { key: d.project.toUpperCase() },
      issuetype: { name: 'Bug' },
      summary: d.summary,
      description: d.descriptionWiki,
    };
    if (d.labels?.length) fullFields.labels = d.labels.map((l) => l.replace(/\s+/g, '-'));
    if (d.priority) fullFields.priority = { name: d.priority };

    let created: any;
    try {
      created = await jiraFetch('POST', '/rest/api/2/issue', { fields: fullFields });
    } catch (e1: any) {
      // Some projects don't expose priority/labels on the create screen — retry with the safe minimum.
      try {
        created = await jiraFetch('POST', '/rest/api/2/issue', {
          fields: { project: fullFields.project, issuetype: fullFields.issuetype, summary: d.summary, description: d.descriptionWiki },
        });
      } catch (e2: any) {
        return reply.code(502).send({ error: `Jira create failed: ${String(e2?.message || e1?.message || e2).slice(0, 250)}` });
      }
    }

    const key = created?.key;
    let attached = 0;
    if (key && d.images?.length) { try { attached = await attachImagesToIssue(key, d.images); } catch { /* noop */ } }
    return reply.send({ key, url: `${cfg.baseUrl}/browse/${key}`, attached });
  });
}
