import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from './config.js';
import { runRolePrompt } from './llm.js';
import { requireAuth } from './auth.js';

// ---------------------------------------------------------------------------
// "Тестирование задач" (Task Testing). Given ONE Jira key, gather everything
// useful for testing — requirements, related issues, all comments, and the
// real feature-branch code from GitLab (discover + fetch branches matching the
// key across the repos in workspaces/, diff vs base) — then put on the tester
// role and produce a STATIC-testing report (no code execution): what the task
// is, a prioritized checklist, detailed test cases, what changed per the
// requirements vs per the code, likely-defect hotspots, and extra notes.
// Encodes skills/04-manual-tester (Pre-Work Task Analysis) as a one-click flow.
// ---------------------------------------------------------------------------
function jiraConfig() {
  const baseUrl = String(process.env.JIRA_BASE_URL || 'https://shiptify.atlassian.net').replace(/\/$/, '');
  const email = String(process.env.JIRA_EMAIL || '').trim();
  const token = String(process.env.JIRA_API_TOKEN || '').trim();
  return { baseUrl, email, token, enabled: !!(baseUrl && email && token) };
}
function jiraAuth() {
  const { email, token } = jiraConfig();
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
}
async function jiraFetch(method: string, apiPath: string, body?: any) {
  const { baseUrl } = jiraConfig();
  const res = await fetch(`${baseUrl}${apiPath}`, {
    method,
    headers: { Authorization: jiraAuth(), 'Content-Type': 'application/json', Accept: 'application/json' },
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

// Jira ADF (rich text) → plain text, for description/comments.
function adfToText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(adfToText).join('');
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (node.content) { const inner = adfToText(node.content); return /paragraph|heading|listItem|bulletList|orderedList/.test(node.type) ? inner + '\n' : inner; }
  return '';
}

const KEY_RE = /^[A-Z][A-Z0-9]+-\d+$/;

async function fetchIssue(key: string) {
  const f = 'summary,description,status,issuetype,priority,labels,assignee,parent,subtasks,comment,issuelinks';
  const data = await jiraFetch('GET', `/rest/api/2/issue/${encodeURIComponent(key)}?fields=${f}`);
  const fields = data.fields || {};
  const comments = (fields.comment?.comments || []).map((c: any) => ({
    author: c.author?.displayName || '', created: (c.created || '').slice(0, 10),
    body: typeof c.body === 'string' ? c.body : adfToText(c.body),
  }));
  const links = (fields.issuelinks || []).map((l: any) => {
    const other = l.outwardIssue || l.inwardIssue;
    const rel = l.outwardIssue ? l.type?.outward : l.type?.inward;
    return other ? { key: other.key, rel, summary: other.fields?.summary || '', status: other.fields?.status?.name || '' } : null;
  }).filter(Boolean);
  const subtasks = (fields.subtasks || []).map((s: any) => ({ key: s.key, summary: s.fields?.summary || '', status: s.fields?.status?.name || '' }));
  return {
    key,
    summary: fields.summary || '',
    description: typeof fields.description === 'string' ? fields.description : adfToText(fields.description),
    status: fields.status?.name || '',
    issuetype: fields.issuetype?.name || '',
    priority: fields.priority?.name || '',
    labels: fields.labels || [],
    assignee: fields.assignee?.displayName || '',
    parent: fields.parent ? { key: fields.parent.key, summary: fields.parent.fields?.summary || '' } : null,
    subtasks,
    comments,
    links,
  };
}

// --- GitLab feature-branch code via the real git repos under workspaces/. ---
function shp(cmd: string, cwd: string, timeoutMs = 90000): Promise<{ ok: boolean; out: string; err: string }> {
  return new Promise((resolve) => {
    exec(cmd, { cwd, timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (error, stdout, stderr) => {
      resolve({ ok: !error, out: String(stdout || ''), err: String(stderr || (error as any)?.message || '') });
    });
  });
}
const WORKSPACES = path.resolve(process.cwd(), 'workspaces');
function codeRepos(): string[] {
  let ents: fs.Dirent[] = [];
  try { ents = fs.readdirSync(WORKSPACES, { withFileTypes: true }); } catch { return []; }
  return ents.filter((e) => e.isDirectory() && e.name !== 'documentation' && fs.existsSync(path.join(WORKSPACES, e.name, '.git')))
    .map((e) => e.name);
}

// Find branches whose name contains the key across all repos (ls-remote, no checkout).
async function discoverBranches(key: string, onStage?: (m: string) => void): Promise<Array<{ repo: string; branch: string }>> {
  const repos = codeRepos();
  if (!repos.length) return [];
  const found: Array<{ repo: string; branch: string }> = [];
  await Promise.all(repos.map(async (repo) => {
    const r = await shp(`git ls-remote --heads origin "*${key}*"`, path.join(WORKSPACES, repo), 45000);
    if (!r.ok) return;
    for (const line of r.out.split('\n')) {
      const m = line.match(/refs\/heads\/(\S+)/);
      if (m) found.push({ repo, branch: m[1] });
    }
  }));
  if (found.length) onStage?.(`🔀 найдены ветки: ${found.map((f) => `${f.repo}:${f.branch}`).join(', ')}`);
  return found.slice(0, 6);
}

// Fetch a branch and produce its diff vs the repo base (changes introduced by the
// branch only, three-dot diff — excludes base drift, per the tester skill).
async function branchDiff(repo: string, branch: string, onStage?: (m: string) => void) {
  const cwd = path.join(WORKSPACES, repo);
  onStage?.(`⬇️ pull ${repo}:${branch}…`);
  await shp(`git fetch origin "${branch}" --quiet`, cwd, 120000);
  let base = '';
  for (const b of ['develop', 'master', 'main']) {
    const v = await shp(`git rev-parse --verify --quiet origin/${b}`, cwd, 20000);
    if (v.ok && v.out.trim()) { base = b; break; }
  }
  const ref = `origin/${branch}`;
  const range = base ? `origin/${base}...${ref}` : `${ref}~5..${ref}`;
  const stat = await shp(`git diff --stat ${range}`, cwd, 45000);
  const log = await shp(`git log --oneline ${base ? `origin/${base}..${ref}` : `-8 ${ref}`}`, cwd, 30000);
  const diff = await shp(`git diff ${range}`, cwd, 60000);
  const DIFF_CAP = 16000;
  let diffText = diff.out;
  let truncated = false;
  if (diffText.length > DIFF_CAP) { diffText = diffText.slice(0, DIFF_CAP); truncated = true; }
  return {
    repo, branch, base: base || '(unknown)',
    commits: log.out.trim().split('\n').filter(Boolean).slice(0, 20),
    stat: stat.out.trim(),
    files: (stat.out.match(/^\s*\S+\s+\|/gm) || []).length,
    diff: diffText, truncated,
  };
}

const LANG_NAME: Record<string, string> = { fr: 'French', en: 'English', ru: 'Russian' };

function buildPrompt(issue: any, branches: any[], lang: string) {
  const reportLang = LANG_NAME[lang] || 'Russian';
  const rel = [
    issue.parent ? `- parent: ${issue.parent.key} — ${issue.parent.summary}` : '',
    ...issue.subtasks.map((s: any) => `- subtask: ${s.key} [${s.status}] — ${s.summary}`),
    ...issue.links.map((l: any) => `- ${l.rel}: ${l.key} [${l.status}] — ${l.summary}`),
  ].filter(Boolean).join('\n') || '(none)';
  const comments = issue.comments.length
    ? issue.comments.slice(0, 14).map((c: any) => `[${c.created}] ${c.author}: ${String(c.body).slice(0, 900)}`).join('\n---\n')
    : '(no comments)';
  const code = branches.length
    ? branches.map((b: any) => `### repo ${b.repo} · branch ${b.branch} (base ${b.base})
commits:
${b.commits.join('\n') || '(none)'}
changed files:
${b.stat || '(stat unavailable)'}
diff (three-dot vs base${b.truncated ? ', TRUNCATED' : ''}):
\`\`\`diff
${b.diff || '(empty)'}
\`\`\``).join('\n\n')
    : '(no feature branches found / code unavailable in this environment — base the code section on what can be inferred and clearly mark it as unverified)';

  return `You are a senior QA engineer at Shiptify (a TMS/logistics SaaS) performing STATIC testing (review WITHOUT running the code). Ground every code claim in the provided diffs (cite file:line); never assert behaviour "from the description" — the branch code is the source of truth. Where you cannot confirm without running the app/DB, mark it "verify (needs run)".

Write the WHOLE report in ${reportLang}, as clean Markdown. Follow EXACTLY these 7 sections with these headings:

## 1. Про что задача — контекст и расположение
What the task is, the business intent, and WHERE it lives (module, screens, services/endpoints, repos/files).

## 2. Чек-лист проверок
Prioritized checklist with severity markers 🔴/🟠/🟡/🟢. One line per check.

## 3. Подробные тест-кейсы
Numbered test cases. For each: Preconditions, Steps, Expected result. Include negative/edge cases. Reference data-testid / screen / endpoint where known.

## 4. Что изменилось по задаче (согласно требованиям)
The intended change per the ticket/comments/acceptance criteria.

## 5. Что изменилось по факту (согласно коду)
The actual change per the branch diffs, with file:line. Explicitly flag any divergence between requirements (section 4) and code (this section) — and debunk myths in the description/AI-summary if the code contradicts them.

## 6. Места с высокой вероятностью дефектов
Defect hotspots with the mechanism and a suggested fix; honest severity. Apply the Shiptify heuristics: ACL parity between listing vs dropdown/export paths; row multiplication in required hasMany JOIN without distinct/group (Sequelize raw vs non-raw); front↔back contract (enum/const values must match literally); legacy column vs new source divergence; falsy fallbacks (forceArray(x)||DEFAULT is dead because [undefined] is truthy); dispatch fallback when account.shipper_id is empty; LIKE without escaping; duplicate data not killed by group-by-PK; missing indexes on new hot paths.

## 7. Дополнительно / комментарии
Anything else useful: assumptions, what to verify with a run, suggested next step (e.g. attach checklist to the QA-Review subtask).

=== JIRA TICKET ${issue.key} ===
Summary: ${issue.summary}
Type: ${issue.issuetype} · Status: ${issue.status} · Priority: ${issue.priority} · Labels: ${(issue.labels || []).join(', ') || 'none'} · Assignee: ${issue.assignee || 'n/a'}
Description:
${(issue.description || '(empty)').slice(0, 5000)}

=== RELATED ISSUES ===
${rel}

=== COMMENTS (product clarifications + AI summaries — treat as hypotheses, verify against code) ===
${comments}

=== FEATURE-BRANCH CODE (source of truth) ===
${code}`;
}

export async function registerTestingApi(app: FastifyInstance) {
  app.get('/api/testing/config', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    return reply.send({ jiraEnabled: jiraConfig().enabled, repos: codeRepos().length });
  });

  const schema = z.object({ key: z.string().min(3).max(300), lang: z.enum(['fr', 'en', 'ru']).optional() });

  app.post('/api/testing/analyze/stream', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    if (!jiraConfig().enabled) return reply.code(503).send({ error: 'Jira is not configured (JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN)' });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    // accept a bare key OR a full Jira URL/text (e.g. https://…/browse/TMS-3726)
    const km = parsed.data.key.toUpperCase().match(/([A-Z][A-Z0-9]+-\d+)/);
    const key = km ? km[1] : '';
    const lang = parsed.data.lang || 'ru';
    if (!KEY_RE.test(key)) return reply.code(400).send({ error: 'Invalid Jira key (expected like TMS-3726 or a browse URL)' });

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event: string, data: any) => { try { raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* client gone */ } };
    const ping = setInterval(() => { try { raw.write(': ping\n\n'); } catch { /* noop */ } }, 15000);
    const stage = (m: string) => send('stage', { msg: m });

    try {
      stage(`📥 Jira ${key} — задача, связи, комментарии…`);
      const issue = await fetchIssue(key);
      stage(`🧩 связей: ${issue.links.length + issue.subtasks.length + (issue.parent ? 1 : 0)} · комментариев: ${issue.comments.length}`);

      stage('🔎 поиск связанных веток в GitLab…');
      const candidates = await discoverBranches(key, stage);
      const branches: any[] = [];
      for (const c of candidates) {
        try { branches.push(await branchDiff(c.repo, c.branch, stage)); }
        catch (e: any) { stage(`⚠️ ${c.repo}:${c.branch} — ${String(e?.message || e).slice(0, 120)}`); }
      }
      if (!candidates.length) stage('ℹ️ ветки по ключу не найдены (или git/доступ недоступен в этой среде) — отчёт по Jira');

      stage(`🧪 статическое тестирование (роль QA, ${config.answerModel})…`);
      const prompt = buildPrompt(issue, branches, lang);
      const r = await runRolePrompt('qa.static_tester', prompt, config.answerModel, (t) => send('delta', { text: t }));
      if (!r.text || !r.text.trim()) throw new Error('LLM returned no report');

      send('result', {
        key, report: r.text,
        meta: {
          issue: { summary: issue.summary, type: issue.issuetype, status: issue.status },
          related: [...(issue.parent ? [{ key: issue.parent.key, rel: 'parent' }] : []), ...issue.subtasks.map((s: any) => ({ key: s.key, rel: 'subtask' })), ...issue.links.map((l: any) => ({ key: l.key, rel: l.rel }))],
          branches: branches.map((b) => ({ repo: b.repo, branch: b.branch, files: b.files, base: b.base })),
          tokens: r.totalTokens || null,
        },
      });
      send('done', {});
    } catch (e: any) {
      send('error', { message: String(e?.message || e).slice(0, 250) });
    } finally {
      clearInterval(ping);
      try { raw.end(); } catch { /* noop */ }
    }
  });
}
