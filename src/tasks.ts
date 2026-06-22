import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from './config.js';
import { runRolePrompt, transcribeAudioFile, analyzeImages } from './llm.js';
import { requireAuth } from './auth.js';
import { getImage, getFile, putFile, storageReady } from './storage.js';

// ---------------------------------------------------------------------------
// "Новые задачи" — turn a free-form brief (typed / voice / images / files)
// into a well-structured Jira task. The program runs a short clarifying-question
// dialogue, and on every turn (re)builds the spec following a fixed template:
//   Context · Idea · In Scope · Out of Scope · Definition of Done · References
//   (+ optional extra detail). When ready, the user files it in Jira in one
// click; the task records who its author is. Jira Cloud REST v2 over fetch.
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

// A "task-like" standard (non-subtask) issue type for a project. Shiptify uses
// English/French names, so match broadly; remember the choice per project.
const TASK_TYPE_RE = /^(task|story|tâche|tache|задача|chore|improvement|new feature)$/i;
const taskTypeCache = new Map<string, string>();
function pickTaskType(issueTypes: any[]): string | null {
  const std = (issueTypes || []).filter((t) => !t.subtask);
  const exact = std.find((t) => TASK_TYPE_RE.test(String(t.name || '').trim()));
  if (exact) return exact.name;
  const taskish = std.find((t) => /task|story|tâche|tache|задача/i.test(String(t.name || '')));
  if (taskish) return taskish.name;
  const notBug = std.find((t) => !/bug|epic|sub/i.test(String(t.name || '')));
  return (notBug || std[0])?.name || null;
}
async function listTaskProjects(): Promise<Array<{ key: string; name: string; taskType: string }>> {
  const data = await jiraFetch('GET', '/rest/api/2/project/search?expand=issueTypes&maxResults=50');
  const out: Array<{ key: string; name: string; taskType: string }> = [];
  for (const p of data?.values || []) {
    const tt = pickTaskType(p.issueTypes || []);
    if (tt) { out.push({ key: p.key, name: p.name, taskType: tt }); taskTypeCache.set(p.key, tt); }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}
async function resolveTaskType(projectKey: string): Promise<string> {
  if (taskTypeCache.has(projectKey)) return taskTypeCache.get(projectKey)!;
  try {
    const data = await jiraFetch('GET', `/rest/api/2/project/${encodeURIComponent(projectKey)}?expand=issueTypes`);
    const tt = pickTaskType(data?.issueTypes || []) || 'Task';
    taskTypeCache.set(projectKey, tt);
    return tt;
  } catch { return 'Task'; }
}

function parseJsonLoose(s: string): any {
  let t = String(s || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const a = t.indexOf('{'); const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

// Deterministically assemble the Jira-wiki body from the structured spec so the
// right-pane preview and what lands in Jira always match. Template-first ("суть"),
// extra detail ("вода") last.
function assembleWiki(spec: any, summary: string): string {
  const arr = (x: any): string[] => Array.isArray(x) ? x.filter((s) => String(s ?? '').trim()) : [];
  const num = (x: any) => arr(x).map((s, i) => `# ${String(s).replace(/^\s*\d+[.)]\s*/, '')}`).join('\n');
  const dod = arr(spec?.dod).map((s) => `* [ ] ${String(s).replace(/^\s*\[[ x]\]\s*/i, '')}`).join('\n');
  const refs = arr(spec?.references).map((s) => `* ${s}`).join('\n');
  const lines: string[] = [];
  lines.push('h2. Context', String(spec?.context || '').trim() || '_(to be confirmed)_', '');
  lines.push('h2. Idea', String(spec?.idea || '').trim() || '_(to be confirmed)_', '');
  lines.push('h2. In Scope', num(spec?.inScope) || '# _(to be confirmed)_', '');
  lines.push('h2. Out of Scope', num(spec?.outScope) || '* _(none)_', '');
  lines.push('h2. Definition of Done (DoD)', dod || '* [ ] _(to be confirmed)_', '');
  if (refs) lines.push('h2. References', refs, '');
  const details = String(spec?.details || '').trim();
  if (details) lines.push('----', details);
  return lines.join('\n').trim();
}

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const LANG_NAME: Record<string, string> = { fr: 'French', en: 'English', ru: 'Russian' };

async function runTaskChat(
  messages: ChatMsg[],
  visionText: string,
  fileNames: string[],
  lang: string,
  onStage?: (m: string) => void,
  onDelta?: (t: string) => void,
) {
  const replyLang = LANG_NAME[lang] || 'French';
  const transcript = messages.map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n\n');
  const attach = [
    visionText ? `Attached images (extracted by vision):\n${visionText}` : '',
    fileNames.length ? `Attached files: ${fileNames.join(', ')}` : '',
  ].filter(Boolean).join('\n\n');

  const prompt = `You are a senior product/delivery analyst at Shiptify (a TMS/logistics SaaS). Your job: turn a rough idea into a crisp, implementation-ready Jira task, "по лучшим стандартам", by (a) asking the FEWEST high-leverage clarifying questions needed, and (b) continuously maintaining a structured spec.

Conduct a short dialogue. On EVERY turn return the best spec you can with the information so far (fill gaps with explicit "(to be confirmed)" placeholders rather than inventing facts). Ask follow-up questions only while they materially change the spec; once you have enough to file a solid task, set "ready": true and ask no more.

Write your conversational "reply" in ${replyLang}. ALWAYS write the SPEC CONTENT (summary + every spec field) in ENGLISH — the final requirements that land in Jira must be English regardless of the chat language. Keep section semantics exactly as the template below.

Return ONLY a JSON object (no prose, no code fences):
{
  "reply": "short conversational message to the user in their language — acknowledge what changed and ask the next question(s), or confirm it's ready to file",
  "questions": ["outstanding clarifying question", "..."],
  "ready": false,
  "summary": "concise imperative Jira task title in English (<=120 chars)",
  "spec": {
    "context": "1-3 sentences: background, the problem/why now, who is affected",
    "idea": "1-3 sentences: the proposed solution in plain terms",
    "inScope": ["concrete, atomic deliverable", "..."],
    "outScope": ["explicitly excluded item", "..."],
    "dod": ["binary, verifiable done-criterion", "..."],
    "references": ["link / ticket / doc / screen name if any"],
    "details": "OPTIONAL extra detail / 'вода' (constraints, edge cases, rollout, data) — only if it adds value, else empty string"
  }
}

Rules:
- "суть" first (Context, Idea, In/Out of Scope, DoD, References); any extra detail goes into "details" LAST.
- DoD items must be testable pass/fail statements; ≥2 of them.
- inScope is numbered work, outScope prevents scope creep, references may be empty.
- Do NOT repeat questions already answered in the conversation. Keep "questions" to at most 4 and only the still-open ones.
- If the user says "go"/"хватит"/"создавай"/"ready", set ready=true and finalize the spec with sensible placeholders for anything still unknown.

${attach ? `=== ATTACHMENTS CONTEXT ===\n${attach}\n` : ''}
=== CONVERSATION SO FAR ===
${transcript}`;

  onStage?.(`🤖 анализ (${config.answerModel})…`);
  const r = await runRolePrompt('analyst.task_writer', prompt, config.answerModel, onDelta);
  if (!r.text || !r.text.trim()) throw new Error('LLM returned no analysis');
  const parsed = parseJsonLoose(r.text);
  const spec = parsed.spec || {};
  const summary = String(parsed.summary || '').trim().slice(0, 250) || 'New task';
  const descriptionWiki = assembleWiki(spec, summary);
  return {
    reply: String(parsed.reply || '').trim(),
    questions: Array.isArray(parsed.questions) ? parsed.questions.filter((q: any) => String(q ?? '').trim()).slice(0, 4) : [],
    ready: !!parsed.ready,
    summary,
    spec,
    descriptionWiki,
    tokens: r.totalTokens || null,
    model: r.model,
  };
}

// Vision pass over attached images → text the chat prompt can ground on.
async function visionFromImages(imageKeys: string[], hint: string): Promise<string> {
  if (!imageKeys?.length || !storageReady()) return '';
  try {
    const loaded: Array<{ buffer: Buffer; mime: string }> = [];
    for (const key of imageKeys.slice(0, 8)) { try { loaded.push(await getImage(key)); } catch { /* skip */ } }
    if (!loaded.length) return '';
    const r = await analyzeImages(loaded, hint || 'Describe what is shown; extract any text, UI elements, errors, IDs.', config.answerModel);
    return (r.text || '').trim();
  } catch { return ''; }
}

async function attachToIssue(issueKey: string, imageKeys: string[], fileKeys: string[]) {
  if (!storageReady()) return 0;
  const { baseUrl } = jiraConfig();
  let attached = 0;
  const post = async (buffer: Buffer, mime: string, name: string) => {
    try {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(buffer)], { type: mime }), name);
      const res = await fetch(`${baseUrl}/rest/api/2/issue/${issueKey}/attachments`, {
        method: 'POST', headers: { Authorization: jiraAuthHeader(), 'X-Atlassian-Token': 'no-check' }, body: form,
      });
      if (res.ok) attached += 1;
    } catch { /* skip a failed attachment */ }
  };
  for (const [i, key] of (imageKeys || []).slice(0, 20).entries()) {
    try { const img = await getImage(key); const ext = (img.mime.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, ''); await post(img.buffer, img.mime, `image-${i + 1}.${ext}`); } catch { /* skip */ }
  }
  for (const key of (fileKeys || []).slice(0, 20)) {
    try { const f = await getFile(key); await post(f.buffer, f.mime, f.name); } catch { /* skip */ }
  }
  return attached;
}

export async function registerTasksApi(app: FastifyInstance) {
  app.get('/api/tasks/config', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const cfg = jiraConfig();
    if (!cfg.enabled) return reply.send({ enabled: false, defaultProject: cfg.defaultProject, projects: [], storage: storageReady() });
    let projects: Array<{ key: string; name: string; taskType: string }> = [];
    try { projects = await listTaskProjects(); } catch { /* still allow default */ }
    return reply.send({ enabled: true, defaultProject: cfg.defaultProject, projects, storage: storageReady() });
  });

  // Voice → text (any language).
  app.post('/api/tasks/transcribe', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    if (!req.isMultipart()) return reply.code(415).send({ error: 'multipart/form-data expected' });
    let tmp = '';
    try {
      for await (const part of req.parts()) {
        if (part.type === 'file' && part.fieldname === 'audio') {
          const buf = await part.toBuffer();
          if (buf.length > 25 * 1024 * 1024) return reply.code(413).send({ error: 'Audio larger than 25MB' });
          tmp = path.join(os.tmpdir(), `task-voice-${Date.now()}.webm`);
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

  // Arbitrary file upload (pdf/docx/xlsx/logs/...) → MinIO key, attached at create.
  app.post('/api/tasks/upload-file', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    if (!storageReady()) return reply.code(503).send({ error: 'Хранилище файлов недоступно' });
    if (!req.isMultipart()) return reply.code(415).send({ error: 'Ожидается multipart/form-data' });
    try {
      for await (const part of req.parts()) {
        if (part.type === 'file' && part.fieldname === 'file') {
          const buf = await part.toBuffer();
          if (buf.length > 30 * 1024 * 1024) return reply.code(413).send({ error: 'Файл больше 30 МБ' });
          const saved = await putFile(buf, part.mimetype, (part as any).filename || 'file', user.id);
          return reply.code(201).send({ key: saved.key, name: saved.name, mime: saved.mime });
        }
      }
      return reply.code(400).send({ error: 'Файл не найден (поле: file)' });
    } catch (e: any) {
      return reply.code(400).send({ error: String(e?.message || e).slice(0, 200) });
    }
  });

  const chatSchema = z.object({
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).min(1).max(40),
    images: z.array(z.string().min(1).max(300)).max(20).optional(),
    files: z.array(z.string().min(1).max(300)).max(20).optional(),
    fileNames: z.array(z.string().max(200)).max(20).optional(),
    visionText: z.string().max(20000).optional(),
    lang: z.enum(['fr', 'en', 'ru']).optional(),
  });

  // Streaming clarifying dialogue (SSE): stage + live LLM delta, then a final
  // `result` event with reply/questions/spec/descriptionWiki/ready/visionText.
  app.post('/api/tasks/chat/stream', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { messages, images = [], fileNames = [], lang = 'fr' } = parsed.data;

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event: string, data: any) => { try { raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* client gone */ } };
    const ping = setInterval(() => { try { raw.write(': ping\n\n'); } catch { /* noop */ } }, 15000);

    try {
      // Vision is computed once (first turn) and re-sent by the client afterwards.
      let visionText = parsed.data.visionText || '';
      if (!visionText && images.length) {
        send('stage', { msg: '🖼 анализ изображений…' });
        const firstUser = messages.find((m) => m.role === 'user')?.content || '';
        visionText = await visionFromImages(images, firstUser);
      }
      const out = await runTaskChat(
        messages, visionText, fileNames, lang,
        (m) => send('stage', { msg: m }),
        (t) => send('delta', { text: t }),
      );
      send('result', { ...out, visionText });
      send('done', {});
    } catch (e: any) {
      send('error', { message: String(e?.message || e).slice(0, 250) });
    } finally {
      clearInterval(ping);
      try { raw.end(); } catch { /* noop */ }
    }
  });

  const createSchema = z.object({
    project: z.string().min(1).max(20),
    summary: z.string().min(3).max(255),
    descriptionWiki: z.string().min(1),
    labels: z.array(z.string().max(60)).max(20).optional(),
    images: z.array(z.string().min(1).max(300)).max(20).optional(),
    files: z.array(z.string().min(1).max(300)).max(20).optional(),
  });

  // Create the Jira task from the (editable) preview. Stamps the author.
  app.post('/api/tasks/create', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const cfg = jiraConfig();
    if (!cfg.enabled) return reply.code(503).send({ error: 'Jira is not configured (JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN)' });
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const d = parsed.data;
    const project = d.project.toUpperCase();
    const issueType = await resolveTaskType(project);

    // Author attribution carried into the task body.
    const by = `${user.name}${user.email ? ` (${user.email})` : ''}`;
    const stamp = `🤖 Создано через Searchify (Новые задачи) — автор: ${by} · ${new Date().toISOString().slice(0, 10)}`;
    const description = `${d.descriptionWiki}\n\n----\n_${stamp}_`;

    const baseFields: any = { project: { key: project }, issuetype: { name: issueType }, summary: d.summary, description };
    const fullFields: any = { ...baseFields };
    if (d.labels?.length) fullFields.labels = d.labels.map((l) => l.replace(/\s+/g, '-'));

    let created: any;
    try {
      created = await jiraFetch('POST', '/rest/api/2/issue', { fields: fullFields });
    } catch (e1: any) {
      // Some projects reject labels on the create screen — retry with the safe minimum.
      try {
        created = await jiraFetch('POST', '/rest/api/2/issue', { fields: baseFields });
      } catch (e2: any) {
        return reply.code(502).send({ error: `Jira create failed: ${String(e2?.message || e1?.message || e2).slice(0, 250)}` });
      }
    }

    const key = created?.key;
    let attached = 0;
    if (key && (d.images?.length || d.files?.length)) {
      try { attached = await attachToIssue(key, d.images || [], d.files || []); } catch { /* noop */ }
    }
    return reply.send({ key, url: `${cfg.baseUrl}/browse/${key}`, issueType, attached });
  });
}
