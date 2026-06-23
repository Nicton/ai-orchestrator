import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from './config.js';
import { runRolePrompt } from './llm.js';
import { requireAuth } from './auth.js';
import { logFeatureUsage } from './usage.js';

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

// Find commits whose MESSAGE contains the Jira key (across all refs) and return
// their diffs. Catches work that was already MERGED into develop and whose
// feature branch was deleted — ls-remote on the branch name finds nothing, but
// the commit (e.g. "fix: [TD-1205] …") is right there in the repo.
async function commitDiffsForKey(key: string, onStage?: (m: string) => void) {
  const out: Array<{ repo: string; branch: string; base: string; commits: string[]; stat: string; files: number; diff: string; truncated: boolean }> = [];
  for (const repo of codeRepos()) {
    if (out.length >= 4) break;
    const cwd = path.join(WORKSPACES, repo);
    const log = await shp(`git -c safe.directory='*' log --all -i --grep "${key}" --pretty=%H -n 3`, cwd, 30000);
    if (!log.ok) continue;
    const shas = log.out.split('\n').map((s) => s.trim()).filter(Boolean);
    for (const sha of shas.slice(0, 2)) {
      if (out.length >= 4) break;
      const subj = (await shp(`git -c safe.directory='*' log -1 --pretty=%s ${sha}`, cwd, 15000)).out.trim();
      const stat = (await shp(`git -c safe.directory='*' show --stat --format= ${sha}`, cwd, 30000)).out.trim();
      let diff = (await shp(`git -c safe.directory='*' show ${sha} --no-color --format=`, cwd, 45000)).out || '';
      let truncated = false;
      if (diff.length > 16000) { diff = diff.slice(0, 16000); truncated = true; }
      onStage?.(`🔎 коммит ${repo}@${sha.slice(0, 9)}: ${subj.slice(0, 60)}`);
      out.push({ repo, branch: `commit ${sha.slice(0, 9)} (merged)`, base: '—', commits: [subj], stat, files: (stat.match(/^\s*\S+\s+\|/gm) || []).length, diff, truncated });
    }
  }
  return out;
}

// --- GitLab REST API path (prod-friendly: no clones/.git needed, just a token).
// Set GITLAB_TOKEN (a read_api PAT) in env. Project paths are stable. ---
function gitlabCfg() {
  const token = String(process.env.GITLAB_TOKEN || '').trim();
  const api = String(process.env.GITLAB_API || 'https://gitlab.com/api/v4').replace(/\/$/, '');
  return { token, api, enabled: !!token };
}
const GITLAB_PROJECTS: Record<string, string> = {
  'admin-app': 'shiptify/admin-app', 'ai-shared': 'shiptify/ai-shared', 'back-office': 'shiptify/apps/back-office',
  'backend': 'shiptify/apps/main-app/backend', 'brinks': 'shiptify/apps/integrations/brinks', 'chat': 'shiptify/apps/chat',
  'core-libs': 'shiptify/packages/core-libs', 'emailing': 'shiptify/emailing', 'frontend-mono': 'shiptify/apps/frontend-mono',
  'frontend': 'shiptify/apps/main-app/frontend', 'generate': 'shiptify/apps/attachments/generate', 'identity': 'shiptify/apps/identity',
  'integrations': 'shiptify/apps/integrations/integrations', 'main-app-automation': 'shiptify/tests/main-app-automation',
  'maintain': 'shiptify/apps/db/maintain', 'microservices': 'shiptify/apps/microservices', 'migrations-bi': 'shiptify/apps/db/migrations-bi',
  'migrations': 'shiptify/apps/db/migrations', 'mini-apps': 'shiptify/mini-apps', 'notifications': 'shiptify/apps/notifications',
  'package-translations': 'shiptify/packages/package-translations', 'public-api-docs': 'shiptify/public-api-docs',
  'public-api': 'shiptify/apps/public-api', 'run-local': 'shiptify/apps/run-local', 'stream-topics': 'shiptify/packages/stream-topics',
  'testing-tools': 'shiptify/apps/integrations/testing-tools', 'translations': 'shiptify/packages/translations', 'ups': 'shiptify/apps/integrations/ups',
};
async function glFetch(apiPath: string): Promise<any> {
  const { api, token } = gitlabCfg();
  const res = await fetch(`${api}${apiPath}`, { headers: { 'PRIVATE-TOKEN': token } });
  if (!res.ok) throw new Error(`GitLab ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
const enc = (p: string) => encodeURIComponent(p);

// Find branches containing the key across all known GitLab projects (API search).
async function discoverBranchesApi(key: string, onStage?: (m: string) => void): Promise<Array<{ repo: string; proj: string; branch: string }>> {
  const found: Array<{ repo: string; proj: string; branch: string }> = [];
  await Promise.all(Object.entries(GITLAB_PROJECTS).map(async ([repo, proj]) => {
    try {
      const branches = await glFetch(`/projects/${enc(proj)}/repository/branches?search=${encodeURIComponent(key)}&per_page=20`);
      for (const b of branches || []) found.push({ repo, proj, branch: b.name });
    } catch { /* project not accessible / no match */ }
  }));
  if (found.length) onStage?.(`🔀 найдены ветки: ${found.map((f) => `${f.repo}:${f.branch}`).join(', ')}`);
  return found.slice(0, 6);
}

// Diff of a branch vs the project default branch via GitLab compare (merge-base based).
async function branchDiffApi(repo: string, proj: string, branch: string, onStage?: (m: string) => void) {
  onStage?.(`⬇️ diff ${repo}:${branch}…`);
  let base = 'develop';
  try { const pj = await glFetch(`/projects/${enc(proj)}`); base = pj.default_branch || 'develop'; } catch { /* keep default */ }
  const cmp = await glFetch(`/projects/${enc(proj)}/repository/compare?from=${encodeURIComponent(base)}&to=${encodeURIComponent(branch)}&straight=false`);
  const diffs = cmp?.diffs || [];
  const DIFF_CAP = 16000;
  let diffText = '';
  let truncated = false;
  for (const d of diffs) {
    diffText += `diff --git a/${d.old_path} b/${d.new_path}\n${d.diff || ''}`;
    if (diffText.length > DIFF_CAP) { diffText = diffText.slice(0, DIFF_CAP); truncated = true; break; }
  }
  return {
    repo, branch, base,
    commits: (cmp?.commits || []).map((c: any) => `${c.short_id || ''} ${c.title || ''}`.trim()).slice(0, 20),
    stat: diffs.map((d: any) => ` ${d.new_path}`).join('\n'),
    files: diffs.length,
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

// Gather feature-branch diffs for a key (GitLab API path or local git), shared
// by the report and the "task for Claude" flows.
async function gatherBranches(key: string, stage: (m: string) => void) {
  const useApi = gitlabCfg().enabled;
  const branches: any[] = [];
  if (useApi) {
    for (const c of await discoverBranchesApi(key, stage)) {
      try { branches.push(await branchDiffApi(c.repo, c.proj, c.branch, stage)); } catch { /* skip */ }
    }
  } else {
    for (const c of await discoverBranches(key, stage)) {
      try { branches.push(await branchDiff(c.repo, c.branch, stage)); } catch { /* skip */ }
    }
  }
  // Also include commits whose message references the key (merged + deleted
  // branches won't show up by name). Crucial for already-merged fixes.
  try {
    for (const c of await commitDiffsForKey(key, stage)) {
      if (branches.length >= 8) break;
      if (!branches.some((b) => b.diff && b.diff === c.diff)) branches.push(c);
    }
  } catch { /* best-effort */ }
  return branches;
}

function branchBlock(branches: any[]): string {
  return branches.length
    ? branches.map((b: any) => `### repo ${b.repo} · branch ${b.branch} (base ${b.base})\nchanged files:\n${b.stat || '(n/a)'}\ndiff:\n\`\`\`diff\n${b.diff || '(empty)'}\n\`\`\``).join('\n\n')
    : '(no feature branches / code unavailable)';
}

// Live HTTP executor for dynamic testing. SSRF-guarded: every request MUST target
// the same host as the user-provided baseUrl. Credentials (label → Authorization
// header value) are injected per request and never echoed back in the results.
type ExecResult = { name: string; method: string; path: string; auth: string | null; expect: string; status: number; body: string };
async function httpExec(baseUrl: string, requests: any[], creds: Record<string, string>, onStage?: (m: string) => void): Promise<ExecResult[]> {
  let base: URL;
  try { base = new URL(baseUrl); } catch { return []; }
  if (!/^https?:$/.test(base.protocol)) return [];
  const out: ExecResult[] = [];
  for (const r of (Array.isArray(requests) ? requests : []).slice(0, 12)) {
    const method = String(r.method || 'GET').toUpperCase();
    let url: URL;
    try { url = new URL(String(r.path || '/'), base); } catch { continue; }
    if (url.host !== base.host) { out.push({ name: r.name || '', method, path: String(r.path || ''), auth: r.auth || null, expect: r.expect || '', status: 0, body: 'skipped: host not allowed (SSRF guard)' }); continue; }
    const headers: Record<string, string> = { accept: 'application/json', ...(r.headers && typeof r.headers === 'object' ? r.headers : {}) };
    if (r.auth && creds[r.auth]) headers['Authorization'] = creds[r.auth];
    const init: any = { method, headers };
    if (r.body != null && method !== 'GET' && method !== 'HEAD') { headers['content-type'] = headers['content-type'] || 'application/json'; init.body = typeof r.body === 'string' ? r.body : JSON.stringify(r.body); }
    onStage?.(`🌐 ${method} ${r.path}${r.auth ? ` [auth:${r.auth}]` : ''}`);
    let status = 0; let bodyText = '';
    try { const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) }); status = res.status; bodyText = (await res.text()).slice(0, 2000); }
    catch (e: any) { bodyText = `ERROR: ${String(e?.message || e).slice(0, 200)}`; }
    out.push({ name: r.name || '', method, path: String(r.path || ''), auth: r.auth || null, expect: r.expect || '', status, body: bodyText });
  }
  return out;
}
function execBlock(results: ExecResult[]): string {
  return results.map((x) => `- ${x.name || '(req)'} → ${x.method} ${x.path}${x.auth ? ` [auth:${x.auth}]` : ''}\n  expected: ${x.expect || '—'}\n  HTTP ${x.status}\n  body: ${x.body.replace(/\s+/g, ' ').slice(0, 700)}`).join('\n');
}

export async function registerTestingApi(app: FastifyInstance) {
  app.get('/api/testing/config', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const gl = gitlabCfg();
    // code source: GitLab API (prod-friendly) wins; else local git clones; else none
    const codeSource = gl.enabled ? 'gitlab-api' : (codeRepos().length ? 'local-git' : 'none');
    return reply.send({ jiraEnabled: jiraConfig().enabled, repos: codeRepos().length, gitlab: gl.enabled, codeSource });
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

      stage('🔎 поиск связанных веток и коммитов…');
      const branches = await gatherBranches(key, stage);
      if (!branches.length) stage('ℹ️ ни веток, ни коммитов по ключу не найдено — отчёт по Jira');

      stage(`🧪 статическое тестирование (роль QA, ${config.answerModel})…`);
      const prompt = buildPrompt(issue, branches, lang);
      const r = await runRolePrompt('qa.static_tester', prompt, config.answerModel, (t) => send('delta', { text: t }));
      await logFeatureUsage({
        userId: user.id, userLabel: user.name, feature: 'testing', action: 'report', ref: `${key} — ${issue.summary}`,
        model: r.model, promptTokens: r.promptTokens, completionTokens: r.completionTokens, totalTokens: r.totalTokens,
        status: r.text && r.text.trim() ? 'ok' : 'error',
      });
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

  // Post a comment to the Jira task (e.g. "Claude ran the checks + preliminary
  // static testing"). Stamps the author + optional link to the Searchify report.
  const commentSchema = z.object({ key: z.string().min(3).max(30), comment: z.string().min(2).max(8000), reportUrl: z.string().max(400).optional() });
  app.post('/api/testing/comment', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    if (!jiraConfig().enabled) return reply.code(503).send({ error: 'Jira is not configured (JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN)' });
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const km = parsed.data.key.toUpperCase().match(/([A-Z][A-Z0-9]+-\d+)/);
    const key = km ? km[1] : '';
    if (!KEY_RE.test(key)) return reply.code(400).send({ error: 'Invalid Jira key' });
    const by = `${user.name}${user.email ? ` (${user.email})` : ''}`;
    const stamp = `🤖 Searchify (Claude) · ${by} · ${new Date().toISOString().slice(0, 10)}`;
    const body = `${parsed.data.comment.trim()}${parsed.data.reportUrl ? `\n\n[Отчёт статического тестирования|${parsed.data.reportUrl}]` : ''}\n\n----\n_${stamp}_`;
    try {
      const created = await jiraFetch('POST', `/rest/api/2/issue/${encodeURIComponent(key)}/comment`, { body });
      const { baseUrl } = jiraConfig();
      const url = `${baseUrl}/browse/${key}${created?.id ? `?focusedCommentId=${created.id}` : ''}`;
      return reply.send({ ok: true, key, id: created?.id || null, url });
    } catch (e: any) {
      return reply.code(502).send({ error: `Jira comment failed: ${String(e?.message || e).slice(0, 200)}` });
    }
  });

  // "Task for Claude": run a free-form instruction on the ticket (grounded in
  // the issue + branch code), then post the result as a Jira comment. SSE.
  const taskSchema = z.object({
    key: z.string().min(3).max(30), task: z.string().min(3), lang: z.enum(['fr', 'en', 'ru']).optional(), reportUrl: z.string().max(400).optional(),
    baseUrl: z.string().max(300).optional(), // enables LIVE dynamic testing against this host
    creds: z.record(z.string().max(8000)).optional(), // label → Authorization header value (e.g. {"A":"Bearer …"})
  });
  app.post('/api/testing/task/stream', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    if (!jiraConfig().enabled) return reply.code(503).send({ error: 'Jira is not configured' });
    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const km = parsed.data.key.toUpperCase().match(/([A-Z][A-Z0-9]+-\d+)/);
    const key = km ? km[1] : '';
    const lang = parsed.data.lang || 'ru';
    const task = parsed.data.task.trim();
    if (!KEY_RE.test(key)) return reply.code(400).send({ error: 'Invalid Jira key' });

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event: string, data: any) => { try { raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* gone */ } };
    const ping = setInterval(() => { try { raw.write(': ping\n\n'); } catch { /* noop */ } }, 15000);
    const stage = (m: string) => send('stage', { msg: m });

    try {
      stage(`📥 Jira ${key}…`);
      const issue = await fetchIssue(key);
      stage('🔎 связанные ветки / код…');
      const branches = await gatherBranches(key, stage);
      const reportLang = LANG_NAME[lang] || 'Russian';
      const baseUrl = parsed.data.baseUrl?.trim() || '';
      const creds = parsed.data.creds || {};
      const credLabels = Object.keys(creds);
      const ticketCtx = `=== JIRA TICKET ${key} ===
Summary: ${issue.summary}
Type: ${issue.issuetype} · Status: ${issue.status}
Description:
${(issue.description || '(empty)').slice(0, 4000)}
Recent comments:
${issue.comments.slice(0, 6).map((c: any) => `- ${c.author}: ${String(c.body).slice(0, 300)}`).join('\n') || 'none'}`;

      let r: Awaited<ReturnType<typeof runRolePrompt>>;
      let execResults: ExecResult[] = [];

      if (baseUrl) {
        // PHASE 1 — plan the HTTP requests (LLM → JSON, no execution yet)
        stage('🧭 Планирую HTTP-запросы…');
        const plannerPrompt = `You are planning a DYNAMIC test for Jira ticket ${key}. Output ONLY a JSON object (no prose, no code fences):
{"requests":[{"name":"short name","method":"GET|POST|PUT|PATCH|DELETE","path":"/api/v1/... (relative to base)","auth":"<one of the credential labels, or omit for unauthenticated>","headers":{},"body":null,"expect":"what a CORRECT (fixed) response should be"}]}
Base URL: ${baseUrl} — every path is relative to it (same host only).
Credential labels available (put the LABEL in "auth"; the secret value is injected server-side and never shown): ${credLabels.join(', ') || '(none — only unauthenticated requests possible)'}.
Plan up to 12 requests that actually verify this ticket end-to-end. For a security/IDOR ticket include: an unauthenticated request (expect 401), cross-account access in BOTH directions (use two different auth labels if available), a same-account positive/regression case (expect 200), invalid input, and the oracle-effect check. Use the concrete test emails/accounts named in the ticket. Ground every request in the ticket + code.

=== USER TASK ===
${task}
${ticketCtx}
=== FEATURE-BRANCH CODE ===
${branchBlock(branches).slice(0, 8000)}`;
        const planRes = await runRolePrompt('qa.http_planner', plannerPrompt, config.answerModel);
        let plan: any = { requests: [] };
        try { let s = (planRes.text || '').trim(); const f = s.match(/```(?:json)?\s*([\s\S]*?)```/i); if (f) s = f[1].trim(); const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a >= 0 && b > a) s = s.slice(a, b + 1); plan = JSON.parse(s); } catch { /* keep empty */ }
        // PHASE 2 — execute the requests for real (SSRF-guarded to baseUrl host)
        const reqs = Array.isArray(plan.requests) ? plan.requests : [];
        stage(`🌐 Выполняю ${reqs.length} запрос(ов) к ${baseUrl}…`);
        execResults = await httpExec(baseUrl, reqs, creds, stage);
        send('exec', { results: execResults });
        // PHASE 3 — analyse the ACTUAL responses → report
        stage(`🤖 Анализ фактических ответов (${config.answerModel})…`);
        const analyzePrompt = `You are Claude, a senior QA engineer at Shiptify. You performed LIVE dynamic testing for Jira ticket ${key}: the HTTP requests below were ACTUALLY EXECUTED and these are the REAL responses. Judge each against its expectation and the ticket. Give a verdict per case (✅ PASS / ❌ FAIL / ⚠️ verify) and an overall conclusion (is the issue fixed?). Be concrete: cite the HTTP status and the relevant part of each body. Never print authorization tokens. Write in ${reportLang} as clean Markdown for a Jira comment; end with a result matrix.

=== USER TASK ===
${task}
${ticketCtx}
=== EXECUTED REQUESTS & REAL RESPONSES (base ${baseUrl}) ===
${execBlock(execResults) || '(no requests were executed)'}

=== FEATURE-BRANCH CODE (for cross-check) ===
${branchBlock(branches).slice(0, 8000)}`;
        r = await runRolePrompt('qa.task_runner', analyzePrompt, config.answerModel, (t) => send('delta', { text: t }));
      } else {
        // No base URL → static analysis only (no live requests).
        stage(`🤖 Claude выполняет задачу — статически (${config.answerModel})…`);
        const prompt = `You are Claude, a senior engineer/QA working on Shiptify (TMS). Carry out the USER TASK for Jira ticket ${key}, grounded ONLY in the ticket context and the actual feature-branch code below. Be concrete and cite file:line. If something cannot be confirmed without running the app/DB, say so ("verify (needs run)"). Note: no live API base URL was provided, so this is STATIC analysis. Write in ${reportLang} as clean Markdown for a Jira comment.

=== USER TASK ===
${task}
${ticketCtx}
=== FEATURE-BRANCH CODE ===
${branchBlock(branches).slice(0, 16000)}`;
        r = await runRolePrompt('qa.task_runner', prompt, config.answerModel, (t) => send('delta', { text: t }));
      }
      await logFeatureUsage({ userId: user.id, userLabel: user.name, feature: 'testing', action: baseUrl ? 'task+http' : 'task', ref: `${key} — ${task.slice(0, 80)}`, model: r.model, promptTokens: r.promptTokens, completionTokens: r.completionTokens, totalTokens: r.totalTokens, status: r.text && r.text.trim() ? 'ok' : 'error' });
      const result = (r.text || '').trim();
      if (!result) throw new Error('LLM returned empty result');

      // post the result as a Jira comment (this whole action is user-initiated)
      stage('💬 Добавляю комментарий в Jira…');
      const by = `${user.name}${user.email ? ` (${user.email})` : ''}`;
      const stamp = `🤖 Searchify (Claude) · задача: «${task.slice(0, 140)}» · ${by} · ${new Date().toISOString().slice(0, 10)}`;
      const body = `${result}${parsed.data.reportUrl ? `\n\n[Отчёт в Searchify|${parsed.data.reportUrl}]` : ''}\n\n----\n_${stamp}_`;
      let commentUrl = '';
      try {
        const created = await jiraFetch('POST', `/rest/api/2/issue/${encodeURIComponent(key)}/comment`, { body });
        const { baseUrl } = jiraConfig();
        commentUrl = `${baseUrl}/browse/${key}${created?.id ? `?focusedCommentId=${created.id}` : ''}`;
      } catch (e: any) { send('stage', { msg: `⚠️ Jira comment: ${String(e?.message || e).slice(0, 120)}` }); }

      send('result', { key, result, commentUrl, tokens: r.totalTokens || null, httpResults: execResults, live: !!baseUrl });
      send('done', {});
    } catch (e: any) {
      send('error', { message: String(e?.message || e).slice(0, 250) });
    } finally {
      clearInterval(ping);
      try { raw.end(); } catch { /* noop */ }
    }
  });
}
