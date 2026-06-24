import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { exec } from 'node:child_process';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from './config.js';
import { runRolePrompt, runClaudeAgent, transcribeAudioFile, analyzeImages } from './llm.js';
import { requireAuth } from './auth.js';
import { getImage, getFile, putFile, storageReady } from './storage.js';
import { prisma } from './db.js';
import { logFeatureUsage } from './usage.js';
import { codeRepos, gatherCodeForKey } from './codeintel.js';

// ---------------------------------------------------------------------------
// "Разработать" (Develop) — an agentic dev pipeline. Given one or more linked
// Jira keys + a comment + files, it (1) analyses the task and asks clarifying
// questions, (2) builds an implementation plan, then on approval (3) pulls the
// latest default branch, (4) makes a per-task working copy on disk (named after
// the task, so several devs can work different tasks/branches in parallel),
// (5) creates a feature branch, (6) runs Claude as an agent to implement it,
// (7) commits & pushes, (8) opens a Draft merge request, and (9) returns the MR
// link. The thread can be continued to request fixes (re-runs the agent, pushes,
// the MR updates). Mirrors the /tasks UX (thread, voice, files, history) and
// records token spend + a satisfaction rating for the admin panel.
// ---------------------------------------------------------------------------
function jiraConfig() {
  const baseUrl = String(process.env.JIRA_BASE_URL || 'https://shiptify.atlassian.net').replace(/\/$/, '');
  const email = String(process.env.JIRA_EMAIL || '').trim();
  const token = String(process.env.JIRA_API_TOKEN || '').trim();
  return { baseUrl, email, token, enabled: !!(baseUrl && email && token) };
}
function jiraAuthHeader() { const { email, token } = jiraConfig(); return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64'); }
async function jiraFetch(method: string, apiPath: string, body?: any) {
  const { baseUrl } = jiraConfig();
  const res = await fetch(`${baseUrl}${apiPath}`, { method, headers: { Authorization: jiraAuthHeader(), 'Content-Type': 'application/json', Accept: 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text(); let json: any = null; try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  if (!res.ok) throw new Error(`Jira ${res.status}: ${json?.errorMessages?.join('; ') || text.slice(0, 300)}`);
  return json;
}
function adfToText(node: any): string {
  if (!node) return ''; if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(adfToText).join('');
  if (node.type === 'text') return node.text || ''; if (node.type === 'hardBreak') return '\n';
  if (node.content) { const inner = adfToText(node.content); return /paragraph|heading|listItem|bulletList|orderedList/.test(node.type) ? inner + '\n' : inner; }
  return '';
}
async function fetchIssueLite(key: string) {
  const data = await jiraFetch('GET', `/rest/api/2/issue/${encodeURIComponent(key)}?fields=summary,description,status,issuetype,priority,comment,issuelinks`);
  const f = data.fields || {};
  const comments = (f.comment?.comments || []).slice(-10).map((c: any) => `${c.author?.displayName || ''}: ${(typeof c.body === 'string' ? c.body : adfToText(c.body)).slice(0, 600)}`);
  return {
    key, summary: f.summary || '', status: f.status?.name || '', type: f.issuetype?.name || '',
    description: (typeof f.description === 'string' ? f.description : adfToText(f.description)).slice(0, 4000),
    comments,
  };
}

const KEY_RE = /([A-Z][A-Z0-9]+-\d+)/g;
const LANG_NAME: Record<string, string> = { fr: 'French', en: 'English', ru: 'Russian' };

// --- shell + git plumbing ---
function sh(cmd: string, cwd: string, timeoutMs = 120000): Promise<{ ok: boolean; out: string; err: string }> {
  // repos under workspaces/ are owned by root → git needs safe.directory to avoid "dubious ownership".
  const c = cmd.startsWith('git ') ? `git -c safe.directory='*' ${cmd.slice(4)}` : cmd;
  return new Promise((resolve) => {
    exec(c, { cwd, timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (error, stdout, stderr) => {
      resolve({ ok: !error, out: String(stdout || ''), err: String(stderr || (error as any)?.message || '') });
    });
  });
}
const WORKSPACES = path.resolve(process.cwd(), 'workspaces');
function devWorkRoot() { return path.resolve(process.env.DEV_WORKDIR || path.join(process.cwd(), 'dev-workspaces')); }
function gitlabWriteToken() {
  const env = String(process.env.GITLAB_WRITE_TOKEN || process.env.GITLAB_TOKEN || '').trim();
  if (env) return env;
  // The PAT is mounted as a file (host ~/.gl_token → container /run/gl_token), same source the
  // git credential helper uses. Read it so push/MR can use it without a separate env var.
  for (const p of [process.env.GL_TOKEN_FILE, '/run/gl_token', path.join(os.homedir(), '.gl_token')]) {
    try { if (p && fs.existsSync(p)) { const v = fs.readFileSync(p, 'utf8').trim(); if (v) return v; } } catch { /* skip */ }
  }
  return '';
}
function safeName(s: string) { return String(s || '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }

// Parse a GitLab https origin into { host, projectPath, apiBase } for push + MR API.
function parseGitlab(originUrl: string): { host: string; projectPath: string; apiBase: string } | null {
  let u = String(originUrl || '').trim();
  u = u.replace(/^git@([^:]+):/, 'https://$1/'); // ssh → https form
  try {
    const url = new URL(u);
    const projectPath = url.pathname.replace(/^\//, '').replace(/\.git$/, '');
    if (!projectPath) return null;
    return { host: url.host, projectPath, apiBase: `${url.protocol}//${url.host}/api/v4` };
  } catch { return null; }
}

// --- planning dialogue (no git side-effects) ---
function parseJsonLoose(s: string): any {
  let t = String(s || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fence) t = fence[1].trim();
  const a = t.indexOf('{'); const b = t.lastIndexOf('}'); if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}
type ChatMsg = { role: 'user' | 'assistant'; content: string };

async function visionFromImages(imageKeys: string[], hint: string): Promise<string> {
  if (!imageKeys?.length || !storageReady()) return '';
  try {
    const loaded: Array<{ buffer: Buffer; mime: string }> = [];
    for (const key of imageKeys.slice(0, 8)) { try { loaded.push(await getImage(key)); } catch { /* skip */ } }
    if (!loaded.length) return '';
    const r = await analyzeImages(loaded, hint || 'Describe the screenshot; extract any text, errors, UI, IDs.', config.answerModel);
    return (r.text || '').trim();
  } catch { return ''; }
}

async function runDevChat(
  messages: ChatMsg[], issues: any[], codeCtx: string, repo: string, visionText: string, fileNames: string[], lang: string,
  onStage?: (m: string) => void, onDelta?: (t: string) => void,
) {
  const replyLang = LANG_NAME[lang] || 'Russian';
  const transcript = messages.map((m) => `${m.role === 'user' ? 'DEV' : 'ASSISTANT'}: ${m.content}`).join('\n\n');
  const ticketCtx = issues.map((i) => `### ${i.key} [${i.status}] — ${i.summary}\n${i.description || '(no description)'}\nRecent comments:\n${(i.comments || []).join('\n') || '(none)'}`).join('\n\n') || '(no Jira context)';
  const attach = [visionText ? `Attached images (vision):\n${visionText}` : '', fileNames.length ? `Attached files: ${fileNames.join(', ')}` : ''].filter(Boolean).join('\n\n');

  const prompt = `You are a senior software engineer at Shiptify (a TMS/logistics SaaS). You will IMPLEMENT a development task end-to-end as an agent, but FIRST you must scope it: ask the fewest high-leverage clarifying questions, then produce a concrete implementation PLAN. Do NOT write code yet — this is the planning turn.

Conduct a short dialogue with the developer. On EVERY turn return the best plan you can with what you know (mark unknowns explicitly). Ask follow-up questions only while they materially change the plan; once you have enough to implement safely, set "ready": true.

Write your conversational "reply" and the "plan" in ${replyLang}. The plan must be concrete and grounded in the provided Jira context and existing code (cite files/areas when known). Target repository: ${repo || '(to be determined — ask which repo if unclear)'}.

Return ONLY a JSON object (no prose, no code fences):
{
  "reply": "short message to the dev — what you understood + the next question(s), or confirm ready to implement",
  "questions": ["open clarifying question", "..."],
  "ready": false,
  "title": "concise imperative change title in English (<=100 chars)",
  "repo": "${repo || ''}",
  "plan": "Markdown implementation plan: goal, affected files/modules, step-by-step changes, edge cases, how to verify (lint/tests), and risks. Be specific."
}

Rules:
- Ground the plan in the Jira ticket(s), comments and the existing code context below. Do not invent APIs.
- If the repository is unclear, ask which repo (one of the available repos) — implementation cannot start without it.
- Keep "questions" to at most 4, only the still-open ones; never repeat answered ones.
- If the dev says "go"/"запускай"/"реализуй"/"ready", set ready=true and finalize the plan with sensible assumptions for anything still unknown.

${attach ? `=== ATTACHMENTS ===\n${attach}\n` : ''}
=== JIRA CONTEXT ===
${ticketCtx}

=== EXISTING CODE CONTEXT (related branches/commits, if any) ===
${codeCtx || '(none found — may be a greenfield change)'}

=== CONVERSATION SO FAR ===
${transcript}`;

  onStage?.(`🤖 анализ задачи и план (${config.answerModel})…`);
  const r = await runRolePrompt('engineer.planner', prompt, config.answerModel, onDelta);
  if (!r.text || !r.text.trim()) throw new Error('LLM returned no analysis');
  const parsed = parseJsonLoose(r.text);
  return {
    reply: String(parsed.reply || '').trim(),
    questions: Array.isArray(parsed.questions) ? parsed.questions.filter((q: any) => String(q ?? '').trim()).slice(0, 4) : [],
    ready: !!parsed.ready,
    title: String(parsed.title || '').trim().slice(0, 120) || 'Dev task',
    repo: String(parsed.repo || repo || '').trim(),
    plan: String(parsed.plan || '').trim(),
    tokens: r.totalTokens || null, promptTokens: r.promptTokens || null, completionTokens: r.completionTokens || null, model: r.model,
  };
}

// --- the actual pipeline (git + agent + MR) ---
type StepLog = { step: string; msg: string; at: string };
async function runPipeline(
  run: { id: string; keys: string[]; title: string; repo: string; plan: string; messages: ChatMsg[]; workdir?: string | null; branch?: string | null; visionText?: string | null },
  followupInstruction: string,
  onStage: (m: string) => void,
): Promise<{ branch: string; workdir: string; mrUrl: string | null; summary: string; tokens: number | null; log: StepLog[]; note?: string }> {
  const log: StepLog[] = [];
  const step = (s: string, m: string) => { log.push({ step: s, msg: m, at: new Date().toISOString() }); onStage(m); };
  const repo = run.repo;
  const repoPath = path.join(WORKSPACES, repo);
  if (!fs.existsSync(path.join(repoPath, '.git'))) throw new Error(`Репозиторий "${repo}" не найден в workspaces/ на сервере`);

  // 1) pull latest from the source clone, learn origin + default branch.
  step('pull', `⬇️ git fetch ${repo} (актуальный main)…`);
  await sh('git fetch origin --prune --quiet', repoPath, 180000);
  const originUrl = (await sh('git config --get remote.origin.url', repoPath)).out.trim();
  const gl = parseGitlab(originUrl);
  let base = 'develop';
  for (const b of ['develop', 'main', 'master']) { const v = await sh(`git rev-parse --verify --quiet origin/${b}`, repoPath); if (v.ok && v.out.trim()) { base = b; break; } }
  if (gl) { try { const pj = await glProject(gl); if (pj?.default_branch) base = pj.default_branch; } catch { /* keep */ } }

  // 2) per-task working copy (named after the task) so devs run in parallel.
  const branch = run.branch || `feature/${safeName(run.keys[0] || run.title)}`;
  const workdir = run.workdir || path.join(devWorkRoot(), `${safeName(run.keys[0] || run.title)}-${repo}`);
  fs.mkdirSync(devWorkRoot(), { recursive: true });
  const fresh = !fs.existsSync(path.join(workdir, '.git'));
  if (fresh) {
    step('copy', `🗂 копия репозитория → ${path.basename(workdir)}…`);
    const cp = await sh(`cp -a "${repoPath}" "${workdir}"`, devWorkRoot(), 300000);
    if (!cp.ok) throw new Error(`Не удалось скопировать репозиторий: ${cp.err.slice(0, 200)}`);
    await sh('git fetch origin --prune --quiet', workdir, 180000);
    step('branch', `🌿 ветка ${branch} от origin/${base}…`);
    const co = await sh(`git checkout -B "${branch}" "origin/${base}"`, workdir, 60000);
    if (!co.ok) throw new Error(`Не удалось создать ветку: ${co.err.slice(0, 200)}`);
  } else {
    step('branch', `🌿 продолжаю на ветке ${branch} (фоллоу-ап)…`);
    await sh(`git checkout "${branch}"`, workdir, 60000);
  }

  // 3) run the agent to implement (file edits only — git is handled here).
  const isFollow = !fresh;
  const agentPrompt = `You are a senior engineer implementing a task in the Shiptify repository "${repo}". You are INSIDE the repo working tree. Make focused, production-quality changes that match the existing code style. Edit files directly. DO NOT run git (no commit/branch/push) — version control is handled by the system. Do not touch unrelated files and never commit secrets.

${isFollow ? `This is a FOLLOW-UP. Apply ONLY this fix/change on top of the existing branch:\n${followupInstruction}\n` : `Implement the task per the approved plan below.`}

Related Jira: ${run.keys.join(', ') || '(none)'}
Title: ${run.title}

=== APPROVED PLAN ===
${run.plan || '(no explicit plan — infer from the title and context)'}

=== THREAD (developer context) ===
${run.messages.map((m) => `${m.role === 'user' ? 'DEV' : 'ASSISTANT'}: ${m.content}`).join('\n\n').slice(0, 6000)}
${run.visionText ? `\n=== ATTACHED SCREENSHOTS (vision) ===\n${run.visionText.slice(0, 2000)}` : ''}

After editing, if the repo has a quick lint/typecheck/test you can run, run it and fix obvious breakages. Finish with a concise summary (Markdown) of WHAT you changed and WHY, listing changed files. Keep the summary under 250 words.`;

  step('implement', `🛠 Claude реализует (${config.answerModel})… это может занять несколько минут`);
  const agent = await runClaudeAgent(workdir, agentPrompt, {
    model: config.answerModel,
    onTool: (t) => onStage(`   ↳ ${t}`),
    timeoutMs: 25 * 60 * 1000,
  });
  const summary = (agent.text || '').trim() || '(агент не вернул сводку)';

  // 4) commit
  const changed = (await sh('git status --porcelain', workdir)).out.trim();
  if (!changed) { step('commit', '⚠️ агент не внёс изменений в файлы'); return { branch, workdir, mrUrl: null, summary, tokens: agent.totalTokens || null, log, note: 'no-changes' }; }
  await sh('git add -A', workdir, 60000);
  const commitMsg = `${run.keys[0] ? `[${run.keys[0]}] ` : ''}${run.title}${isFollow ? ' (follow-up)' : ''}`.replace(/"/g, "'");
  step('commit', `📝 commit: ${commitMsg}`);
  const commit = await sh(`git -c user.name="Searchify" -c user.email="searchify@shiptify.com" commit -m "${commitMsg}"`, workdir, 60000);
  if (!commit.ok && !/nothing to commit/.test(commit.out + commit.err)) throw new Error(`commit failed: ${(commit.err || commit.out).slice(0, 200)}`);

  // 5) push (needs a write token)
  const token = gitlabWriteToken();
  if (!token || !gl) {
    step('push', '🛑 Пуш пропущен: нет GITLAB_WRITE_TOKEN (или origin не GitLab). Изменения закоммичены локально.');
    return { branch, workdir, mrUrl: null, summary, tokens: agent.totalTokens || null, log, note: 'no-write-token' };
  }
  const pushUrl = `https://oauth2:${token}@${gl.host}/${gl.projectPath}.git`;
  step('push', `⬆️ push origin ${branch}…`);
  const push = await sh(`git push "${pushUrl}" "HEAD:${branch}" --force-with-lease`, workdir, 180000);
  if (!push.ok) {
    const masked = (push.err || '').replace(token, '***');
    if (/403|denied|insufficient|write_repository/i.test(masked)) throw new Error(`Push отклонён — токен без прав записи (нужен write_repository): ${masked.slice(0, 160)}`);
    throw new Error(`push failed: ${masked.slice(0, 200)}`);
  }

  // 6) open / find the Draft MR
  step('mr', '🔀 открываю merge request (Draft)…');
  const mrUrl = await openMergeRequest(gl, token, branch, base, run, summary);
  step('mr', mrUrl ? `✅ MR: ${mrUrl}` : '⚠️ MR не создан (см. лог)');
  return { branch, workdir, mrUrl, summary, tokens: agent.totalTokens || null, log };
}

async function glProject(gl: { apiBase: string; projectPath: string }) {
  const token = gitlabWriteToken(); if (!token) return null;
  const res = await fetch(`${gl.apiBase}/projects/${encodeURIComponent(gl.projectPath)}`, { headers: { 'PRIVATE-TOKEN': token } });
  if (!res.ok) return null; return res.json();
}
async function openMergeRequest(gl: { apiBase: string; projectPath: string; host: string }, token: string, branch: string, base: string, run: { keys: string[]; title: string; plan: string }, summary: string): Promise<string | null> {
  const proj = encodeURIComponent(gl.projectPath);
  const jiraLinks = run.keys.map((k) => `[${k}](https://shiptify.atlassian.net/browse/${k})`).join(', ');
  const description = `### ${run.title}\n${jiraLinks ? `Jira: ${jiraLinks}\n` : ''}\n**Что сделано (агент):**\n${summary}\n\n<details><summary>План реализации</summary>\n\n${run.plan || '—'}\n\n</details>\n\n----\n🤖 Сгенерировано Searchify (Разработать). Требует ревью человеком перед мержем.`;
  const title = `Draft: ${run.keys[0] ? `[${run.keys[0]}] ` : ''}${run.title}`;
  // try to create
  const res = await fetch(`${gl.apiBase}/projects/${proj}/merge_requests`, {
    method: 'POST', headers: { 'PRIVATE-TOKEN': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_branch: branch, target_branch: base, title, description, remove_source_branch: true }),
  });
  if (res.ok) { const j: any = await res.json(); return j.web_url || null; }
  // already exists? fetch it
  const list = await fetch(`${gl.apiBase}/projects/${proj}/merge_requests?source_branch=${encodeURIComponent(branch)}&state=opened`, { headers: { 'PRIVATE-TOKEN': token } });
  if (list.ok) { const arr: any[] = await list.json(); if (arr?.[0]?.web_url) return arr[0].web_url; }
  return null;
}

// Post the MR link back to the related Jira tickets (best-effort).
async function postMrToJira(keys: string[], mrUrl: string, title: string, by: string) {
  if (!jiraConfig().enabled || !mrUrl) return;
  const body = `🤖 Searchify (Разработать): открыт merge request для «${title}».\n${mrUrl}\n\n----\n_Запустил: ${by} · ${new Date().toISOString().slice(0, 10)}_`;
  for (const k of keys) { try { await jiraFetch('POST', `/rest/api/2/issue/${encodeURIComponent(k)}/comment`, { body }); } catch { /* skip */ } }
}

export async function registerDevelopApi(app: FastifyInstance) {
  app.get('/api/develop/config', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    return reply.send({ jiraEnabled: jiraConfig().enabled, storage: storageReady(), repos: codeRepos(), canPush: !!gitlabWriteToken() });
  });

  // Voice → text.
  app.post('/api/develop/transcribe', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    if (!req.isMultipart()) return reply.code(415).send({ error: 'multipart/form-data expected' });
    let tmp = '';
    try {
      for await (const part of req.parts()) {
        if (part.type === 'file' && part.fieldname === 'audio') {
          const buf = await part.toBuffer();
          if (buf.length > 25 * 1024 * 1024) return reply.code(413).send({ error: 'Audio larger than 25MB' });
          tmp = path.join(os.tmpdir(), `dev-voice-${Date.now()}.webm`);
          await fs.promises.writeFile(tmp, buf);
          const tr = await transcribeAudioFile(tmp);
          return reply.send({ text: tr.text, language: tr.language });
        }
      }
      return reply.code(400).send({ error: 'No audio file (field: audio)' });
    } catch (e: any) { return reply.code(400).send({ error: String(e?.message || e).slice(0, 250) }); }
    finally { if (tmp) { try { await fs.promises.unlink(tmp); } catch { /* noop */ } } }
  });

  // File upload (up to 20 in the UI) → MinIO key.
  app.post('/api/develop/upload-file', async (req: any, reply) => {
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
    } catch (e: any) { return reply.code(400).send({ error: String(e?.message || e).slice(0, 200) }); }
  });

  // Planning dialogue (SSE): analyse task(s) + produce plan + clarifying questions.
  const chatSchema = z.object({
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).min(1).max(40),
    keys: z.array(z.string().max(30)).max(10).optional(),
    repo: z.string().max(60).optional(),
    images: z.array(z.string().min(1).max(300)).max(20).optional(),
    files: z.array(z.string().min(1).max(300)).max(20).optional(),
    fileNames: z.array(z.string().max(200)).max(20).optional(),
    visionText: z.string().max(20000).optional(),
    lang: z.enum(['fr', 'en', 'ru']).optional(),
  });
  app.post('/api/develop/chat/stream', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { messages, repo = '', images = [], fileNames = [], lang = 'ru' } = parsed.data;
    const allText = messages.map((m) => m.content).join(' ');
    const keys = (parsed.data.keys && parsed.data.keys.length ? parsed.data.keys : (allText.match(KEY_RE) || [])).map((k) => k.toUpperCase());
    const uniqKeys = Array.from(new Set(keys)).slice(0, 10);

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event: string, data: any) => { try { raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* gone */ } };
    const ping = setInterval(() => { try { raw.write(': ping\n\n'); } catch { /* noop */ } }, 15000);

    try {
      let visionText = parsed.data.visionText || '';
      if (!visionText && images.length) { send('stage', { msg: '🖼 анализ изображений…' }); visionText = await visionFromImages(images, messages.find((m) => m.role === 'user')?.content || ''); }
      const issues: any[] = [];
      if (uniqKeys.length && jiraConfig().enabled) {
        send('stage', { msg: `📥 Jira: ${uniqKeys.join(', ')}…` });
        for (const k of uniqKeys) { try { issues.push(await fetchIssueLite(k)); } catch { /* skip */ } }
      }
      let codeCtx = '';
      if (uniqKeys.length) {
        send('stage', { msg: '🔎 поиск связанного кода…' });
        try { const refs = await gatherCodeForKey(uniqKeys[0], (m) => send('stage', { msg: m })); codeCtx = refs.map((b: any) => `repo ${b.repo} · ${b.branch}\n${b.stat || ''}`).join('\n\n').slice(0, 4000); } catch { /* skip */ }
      }
      const out = await runDevChat(messages, issues, codeCtx, repo, visionText, fileNames, lang, (m) => send('stage', { msg: m }), (t) => send('delta', { text: t }));
      await logFeatureUsage({ userId: user.id, userLabel: user.name, feature: 'develop', action: 'plan', ref: `${uniqKeys.join(',')} — ${out.title}`, model: out.model, promptTokens: out.promptTokens, completionTokens: out.completionTokens, totalTokens: out.tokens });
      send('result', { ...out, keys: uniqKeys, visionText });
      send('done', {});
    } catch (e: any) { send('error', { message: String(e?.message || e).slice(0, 250) }); }
    finally { clearInterval(ping); try { raw.end(); } catch { /* noop */ } }
  });

  // Save / resume a dev run (the thread + plan + repo). Returns the run id.
  const saveSchema = z.object({
    id: z.string().max(40).optional(),
    title: z.string().max(255).optional(),
    keys: z.array(z.string().max(30)).max(10).optional(),
    repo: z.string().max(60).optional(),
    plan: z.string().max(40000).optional(),
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).max(80),
    images: z.array(z.string().max(300)).max(20).optional(),
    files: z.array(z.object({ key: z.string().max(300), name: z.string().max(200) })).max(20).optional(),
    visionText: z.string().max(20000).optional(),
    lang: z.enum(['fr', 'en', 'ru']).optional(),
  });
  app.post('/api/develop/save', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const d = parsed.data;
    const data: any = { title: (d.title || '').slice(0, 255), keys: d.keys ?? [], repo: d.repo ?? null, plan: d.plan ?? null, messages: d.messages, images: d.images ?? [], files: d.files ?? [], visionText: d.visionText ?? null, lang: d.lang ?? null };
    try {
      if (d.id) {
        const ex = await prisma.devRun.findUnique({ where: { id: d.id } });
        if (ex && ex.userId === user.id) { const upd = await prisma.devRun.update({ where: { id: d.id }, data }); return reply.send({ id: upd.id, status: upd.status }); }
      }
      const created = await prisma.devRun.create({ data: { ...data, userId: user.id, userLabel: user.name, status: 'DRAFT' } });
      return reply.send({ id: created.id, status: created.status });
    } catch (e: any) { return reply.code(500).send({ error: String(e?.message || e).slice(0, 200) }); }
  });

  app.get('/api/develop/history', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const rows = await prisma.devRun.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 100, select: { id: true, title: true, keys: true, repo: true, status: true, mrUrl: true, branch: true, rating: true, updatedAt: true, messages: true } });
    return reply.send({ items: rows.map((r) => ({ id: r.id, title: r.title, keys: r.keys, repo: r.repo, status: r.status, mrUrl: r.mrUrl, branch: r.branch, rating: r.rating, updatedAt: r.updatedAt, turns: Array.isArray(r.messages) ? (r.messages as any[]).length : 0 })) });
  });
  app.get('/api/develop/run/:id', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const row = await prisma.devRun.findUnique({ where: { id: String(req.params.id) } });
    if (!row) return reply.code(404).send({ error: 'not found' });
    return reply.send({ run: row });
  });
  app.delete('/api/develop/run/:id', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const row = await prisma.devRun.findUnique({ where: { id: String(req.params.id) } });
    if (!row || row.userId !== user.id) return reply.code(404).send({ error: 'not found' });
    await prisma.devRun.delete({ where: { id: row.id } });
    return reply.send({ ok: true });
  });

  // Satisfaction rating for the result (👍/👎 + optional note) → DevRun + admin usage.
  const fbSchema = z.object({ id: z.string().max(40), rating: z.number().int().min(-1).max(1), note: z.string().max(500).optional() });
  app.post('/api/develop/feedback', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = fbSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const row = await prisma.devRun.findUnique({ where: { id: parsed.data.id } });
    if (!row || row.userId !== user.id) return reply.code(404).send({ error: 'not found' });
    await prisma.devRun.update({ where: { id: row.id }, data: { rating: parsed.data.rating, ratingNote: parsed.data.note ?? null } });
    await logFeatureUsage({ userId: user.id, userLabel: user.name, feature: 'develop', action: 'feedback', ref: `${(row.keys || []).join(',')} — ${row.title}`, rating: parsed.data.rating, ratingNote: parsed.data.note ?? null, totalTokens: 0 });
    return reply.send({ ok: true });
  });

  // Execute the pipeline for a saved run (must have an id, a repo and a plan).
  // Re-runnable: a follow-up message becomes a fix instruction on the same branch.
  const runSchema = z.object({ id: z.string().max(40), instruction: z.string().max(8000).optional() });
  app.post('/api/develop/run/stream', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const row = await prisma.devRun.findUnique({ where: { id: parsed.data.id } });
    if (!row || row.userId !== user.id) return reply.code(404).send({ error: 'not found' });

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event: string, data: any) => { try { raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* gone */ } };
    const ping = setInterval(() => { try { raw.write(': ping\n\n'); } catch { /* noop */ } }, 15000);
    const stage = (m: string) => send('stage', { msg: m });

    try {
      if (!row.repo) throw new Error('Не указан репозиторий для реализации');
      if (!codeRepos().includes(row.repo)) throw new Error(`Репозиторий "${row.repo}" недоступен на сервере`);
      await prisma.devRun.update({ where: { id: row.id }, data: { status: 'RUNNING' } });
      const res = await runPipeline(
        { id: row.id, keys: row.keys || [], title: row.title, repo: row.repo, plan: row.plan || '', messages: (row.messages as any[]) || [], workdir: row.workdir, branch: row.branch, visionText: row.visionText },
        parsed.data.instruction || '',
        stage,
      );
      const status = res.mrUrl ? 'MR_OPEN' : (res.note === 'no-write-token' ? 'PUSHED' : (res.note === 'no-changes' ? 'PLANNED' : 'PUSHED'));
      const newMessages = [...((row.messages as any[]) || [])];
      if (parsed.data.instruction) newMessages.push({ role: 'user', content: parsed.data.instruction });
      newMessages.push({ role: 'assistant', content: `${res.summary}${res.mrUrl ? `\n\n**MR:** ${res.mrUrl}` : ''}` });
      await prisma.devRun.update({ where: { id: row.id }, data: { status, branch: res.branch, workdir: res.workdir, mrUrl: res.mrUrl ?? row.mrUrl, messages: newMessages, log: res.log as any } });
      await logFeatureUsage({ userId: user.id, userLabel: user.name, feature: 'develop', action: parsed.data.instruction ? 'fix' : 'implement', ref: `${(row.keys || []).join(',')} — ${row.title}`, model: config.answerModel, totalTokens: res.tokens, status: 'ok' });
      if (res.mrUrl) { try { await postMrToJira(row.keys || [], res.mrUrl, row.title, `${user.name}`); } catch { /* skip */ } }
      send('result', { branch: res.branch, mrUrl: res.mrUrl, summary: res.summary, status, note: res.note || null, log: res.log });
      send('done', {});
    } catch (e: any) {
      try { await prisma.devRun.update({ where: { id: row.id }, data: { status: 'ERROR' } }); } catch { /* noop */ }
      send('error', { message: String(e?.message || e).slice(0, 300) });
    } finally { clearInterval(ping); try { raw.end(); } catch { /* noop */ } }
  });
}
