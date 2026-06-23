import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from './config.js';
import { runRolePrompt } from './llm.js';
import { requireAuth } from './auth.js';
import { prisma } from './db.js';

// ---------------------------------------------------------------------------
// DocSync — incremental documentation update over a date window [from→today].
// Agent-executed workflow; this module is the in-app surface: button + dates
// (first run manual, later prefilled with last sync), incremental window (only
// sources changed in the window — no full doc scan), a run log that makes the
// NEW modules & features explicit, history, and a human-gated publish that
// writes NEW doc files into a NEW folder (never edits existing docs).
// See memory project-doc-update-arch.
// ---------------------------------------------------------------------------
function jiraConfig() {
  const baseUrl = String(process.env.JIRA_BASE_URL || 'https://shiptify.atlassian.net').replace(/\/$/, '');
  const email = String(process.env.JIRA_EMAIL || '').trim();
  const token = String(process.env.JIRA_API_TOKEN || '').trim();
  return { baseUrl, email, token, enabled: !!(baseUrl && email && token) };
}
async function jiraFetch(method: string, apiPath: string) {
  const { baseUrl, email, token } = jiraConfig();
  const res = await fetch(`${baseUrl}${apiPath}`, { method, headers: { Authorization: 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64'), Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Jira ${res.status}`);
  return res.json();
}

const WORKSPACES = path.resolve(process.cwd(), 'workspaces');
const DOCROOT = path.join(WORKSPACES, 'documentation');
const GIT = "git -c safe.directory='*'";
function shp(cmd: string, cwd: string, timeoutMs = 90000): Promise<string> {
  return new Promise((resolve) => exec(cmd, { cwd, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (err, stdout) => resolve(err ? '' : String(stdout))));
}
const PROD_REPOS = ['backend', 'frontend-mono', 'frontend', 'mini-apps', 'back-office', 'admin-app', 'public-api', 'public-api-docs', 'integrations', 'ups', 'brinks', 'generate', 'emailing', 'notifications', 'microservices', 'migrations', 'migrations-bi'];
function availableRepos(): string[] {
  return PROD_REPOS.filter((r) => { try { return fs.existsSync(path.join(WORKSPACES, r, '.git')); } catch { return false; } });
}
const KEY_RE = /[A-Z][A-Z0-9]+-\d+/g;
const isDateStr = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
function commitType(s: string): string { const m = s.match(/^(\w+)(\(|:|!)/); return m ? m[1].toLowerCase() : 'other'; }

function moduleOf(repo: string, file: string): string {
  const f = file.toLowerCase();
  if (repo === 'migrations' || repo === 'migrations-bi') return 'DB / migrations';
  if (repo === 'backend' && /app\/models\//.test(f)) return 'DB / models';
  if (repo === 'backend' && /app\/(controllers|routes)\//.test(f)) return 'Backend API';
  if (repo === 'backend' && /app\/services\//.test(f)) return 'Backend services';
  if (repo === 'back-office') return 'Back-Office';
  if (repo === 'admin-app') return 'Admin BO';
  if (repo === 'public-api' || repo === 'public-api-docs') return 'Public API';
  if (repo === 'mini-apps') return 'DOCK / Slotify';
  if (/integrations|ups|brinks/.test(repo)) return 'Integrations';
  if (repo === 'notifications' || repo === 'emailing') return 'Notifications / Email';
  if (repo === 'generate') return 'Attachments / CMR';
  if (repo === 'frontend-mono' || repo === 'frontend') { const m = file.match(/app\/([a-z0-9_-]+)\//i); return 'Frontend' + (m ? ` / ${m[1]}` : ''); }
  return repo;
}

type Commit = { repo: string; sha: string; author: string; date: string; subject: string; type: string; keys: string[] };

// Only sources changed within the window [from → today].
async function windowDelta(from: string, onStage?: (m: string) => void) {
  const repos = availableRepos();
  const repoInfo: Array<{ repo: string; commits: number; files: string[] }> = [];
  const commits: Commit[] = [];
  for (const repo of repos) {
    const cwd = path.join(WORKSPACES, repo);
    onStage?.(`⬇️ ${repo}: fetch + delta с ${from}…`);
    await shp(`${GIT} fetch --quiet --all --tags`, cwd, 120000);
    let to = 'origin/develop';
    if (!(await shp(`${GIT} rev-parse --verify --quiet origin/develop`, cwd, 15000)).trim()) {
      to = (await shp(`${GIT} rev-parse --verify --quiet origin/master`, cwd, 15000)).trim() ? 'origin/master' : 'origin/HEAD';
    }
    let base = (await shp(`${GIT} rev-list -1 --before="${from} 00:00" ${to}`, cwd, 20000)).trim();
    const range = base ? `${base}..${to}` : `${to}~150..${to}`;
    const log = await shp(`${GIT} log ${range} --no-merges --pretty=%H%x09%an%x09%ad%x09%s --date=short`, cwd, 60000);
    const lines = log.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
      const [sha, author, date, ...rest] = l.split('\t'); const subject = rest.join('\t'); if (!subject) continue;
      commits.push({ repo, sha: (sha || '').slice(0, 9), author: author || '', date: date || '', subject, type: commitType(subject), keys: subject.match(KEY_RE) || [] });
    }
    const files = (await shp(`${GIT} diff --name-only ${range}`, cwd, 60000)).split('\n').map((s) => s.trim()).filter(Boolean);
    if (lines.length || files.length) repoInfo.push({ repo, commits: lines.length, files });
  }
  return { repos: repoInfo, commits };
}

async function enrichJira(keys: string[]): Promise<Map<string, any>> {
  const out = new Map<string, any>();
  if (!jiraConfig().enabled || !keys.length) return out;
  const uniq = [...new Set(keys)];
  for (let i = 0; i < uniq.length; i += 50) {
    const batch = uniq.slice(i, i + 50);
    try {
      const data = await jiraFetch('GET', `/rest/api/2/search?jql=${encodeURIComponent(`key in (${batch.join(',')})`)}&fields=summary,issuetype,status,project,components,labels&maxResults=50`);
      for (const it of data?.issues || []) out.set(it.key, { summary: it.fields?.summary || '', type: it.fields?.issuetype?.name || '', status: it.fields?.status?.name || '', project: it.fields?.project?.key || it.key.split('-')[0], components: (it.fields?.components || []).map((c: any) => c.name) });
    } catch { /* skip batch */ }
  }
  return out;
}

// Current documentation map (relative .md paths under product/) so the LLM
// references existing modules and proposes NEW files instead of editing.
function docMap(): string[] {
  const root = path.join(DOCROOT, 'product');
  const out: string[] = [];
  const walk = (d: string) => {
    let ents: fs.Dirent[] = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) { if (out.length < 400) walk(fp); }
      else if (e.name.endsWith('.md')) { const rel = fp.replace(DOCROOT + path.sep, '').split(path.sep).join('/'); if (out.length < 400) out.push(rel); }
    }
  };
  walk(root);
  return out;
}

function aggregate(commits: Commit[]) {
  const tasks = new Map<string, { key: string; repos: Set<string>; subjects: string[] }>();
  for (const c of commits) {
    for (const key of c.keys) {
      if (!tasks.has(key)) tasks.set(key, { key, repos: new Set(), subjects: [] });
      const t = tasks.get(key)!; t.repos.add(c.repo); if (t.subjects.length < 3) t.subjects.push(c.subject);
    }
  }
  return { tasks };
}

function buildDigest(delta: any, tasks: Map<string, any>, jira: Map<string, any>, docs: string[], agentNotes: string, from: string, to: string) {
  const moduleCount = new Map<string, number>();
  for (const r of delta.repos) for (const f of r.files as string[]) moduleCount.set(moduleOf(r.repo, f), (moduleCount.get(moduleOf(r.repo, f)) || 0) + 1);
  const taskLines = [...tasks.values()].map((t) => { const j = jira.get(t.key) || {}; return `- ${t.key} [${j.type || '?'}/${j.status || '?'}] ${j.project || ''} repos=${[...t.repos].join(',')}${j.components?.length ? ` comp=${j.components.join('/')}` : ''} — ${j.summary || t.subjects[0] || ''}`; });
  const modLines = [...moduleCount.entries()].sort((a, b) => b[1] - a[1]).map(([m, n]) => `- ${m}: ${n} файлов`);
  return [
    `WINDOW: ${from} → ${to}`,
    `\nTASKS in window (commits aggregated by Jira key; ${tasks.size}):\n${taskLines.join('\n') || '(none)'}`,
    `\nMODULES touched (by changed-file count):\n${modLines.join('\n') || '(none)'}`,
    agentNotes ? `\nAGENT NOTES (Drive/Fathom/Slack — продуктовые решения, собранные агентом):\n${agentNotes.slice(0, 6000)}` : '',
    `\nEXISTING DOC FILES (product/…; do NOT edit these — propose NEW files):\n${docs.slice(0, 250).join('\n')}`,
  ].filter(Boolean).join('\n');
}

async function runEngine(digest: string, from: string, to: string, onDelta?: (t: string) => void) {
  const prompt = `You are the documentation maintainer for Shiptify (TMS/logistics SaaS). Update the product docs for the change window ${from} → ${to}. The commit/Jira delta is the point of reference — turn it into commits→tasks→modules→documentation.

STRICT RULES:
- Document only what is NEW or materially changed IN THIS WINDOW. Do not re-document the whole product.
- NEVER edit existing doc files. Propose only NEW markdown files (they will be placed in a new folder). Reference existing modules by path where relevant.
- Ground every statement in the delta (Jira summaries, commit subjects, modules, agent notes). Do not invent features.
- Write doc content in Russian (the docs are RU), clean Markdown.

Return ONLY a JSON object (no prose, no code fences):
{
  "summary": "1-3 предложения: что нового в окне",
  "newModules": ["новый или существенно изменённый модуль", "..."],
  "newFeatures": [{"key":"TMS-1234","title":"краткое название фичи","module":"модуль"}],
  "proposals": [
    {"slug":"kebab-имя-файла","title":"Заголовок страницы","module":"модуль","bodyMd":"# Заголовок\\n\\nОписание фичи: что делает, для кого, как работает, затронутые экраны/эндпоинты, ссылки на Jira-ключи. Markdown."}
  ]
}
Группируй фичи по модулям: обычно один proposal на модуль (или на крупную фичу). Если в окне нет содержательных изменений — верни пустые массивы.

=== DELTA DIGEST ===
${digest.slice(0, 20000)}`;
  const r = await runRolePrompt('doc.sync_writer', prompt, config.answerModel, onDelta);
  if (!r.text || !r.text.trim()) throw new Error('LLM returned empty');
  let s = r.text.trim(); const f = s.match(/```(?:json)?\s*([\s\S]*?)```/i); if (f) s = f[1].trim();
  const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return { parsed: JSON.parse(s), tokens: r.totalTokens || null };
}

const slugify = (s: string) => String(s || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'page';

export async function registerDocSyncApi(app: FastifyInstance) {
  app.get('/api/docsync/config', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const last = await prisma.docSyncRun.findFirst({ orderBy: { createdAt: 'desc' }, select: { toDate: true, createdAt: true } });
    return reply.send({ jiraEnabled: jiraConfig().enabled, repos: availableRepos(), lastSyncDate: last?.toDate || null, lastSyncAt: last?.createdAt || null });
  });

  const runSchema = z.object({ from: z.string().min(4).max(20), agentNotes: z.string().max(20000).optional() });
  app.post('/api/docsync/run/stream', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = runSchema.safeParse(req.body || {});
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const from = parsed.data.from.trim();
    if (!isDateStr(from)) return reply.code(400).send({ error: 'from must be YYYY-MM-DD' });
    const to = new Date().toISOString().slice(0, 10);
    const agentNotes = parsed.data.agentNotes?.trim() || '';

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event: string, data: any) => { try { raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* gone */ } };
    const ping = setInterval(() => { try { raw.write(': ping\n\n'); } catch { /* noop */ } }, 15000);
    const logLines: string[] = [];
    const stage = (m: string) => { logLines.push(m); send('stage', { msg: m }); };

    try {
      stage(`🗓 Окно: ${from} → ${to}`);
      const delta = await windowDelta(from, stage);
      stage(`🧩 Репозиториев с изменениями: ${delta.repos.length}, коммитов: ${delta.commits.length}`);
      const { tasks } = aggregate(delta.commits);
      stage(`📥 Jira: ${tasks.size} задач…`);
      const jira = await enrichJira([...tasks.keys()]);
      const docs = docMap();
      stage(`📚 Текущих док-файлов: ${docs.length}`);
      const digest = buildDigest(delta, tasks, jira, docs, agentNotes, from, to);
      stage(`🤖 Анализ и предложения по доке (${config.answerModel})…`);
      const { parsed: out, tokens } = await runEngine(digest, from, to, (t) => send('delta', { text: t }));

      const dateFolder = `product/updates/${to}`;
      const proposals = (out.proposals || []).slice(0, 30).map((p: any, i: number) => ({
        path: `${dateFolder}/${slugify(p.slug || p.title || `update-${i + 1}`)}.md`,
        title: p.title || '', module: p.module || '', bodyMd: String(p.bodyMd || ''), applied: false,
      }));
      const addedModules = Array.isArray(out.newModules) ? out.newModules : [];
      const addedFeatures = Array.isArray(out.newFeatures) ? out.newFeatures : [];
      stage(`✅ Новых модулей: ${addedModules.length}; фич: ${addedFeatures.length}; предложений: ${proposals.length}`);

      const run = await prisma.docSyncRun.create({
        data: {
          createdBy: user.name, createdById: user.id, fromDate: from, toDate: to, status: 'draft',
          sources: { repos: delta.repos.length, commits: delta.commits.length, jiraKeys: tasks.size, agentNotes: !!agentNotes },
          addedModules, addedFeatures, proposals, log: logLines.join('\n'),
        },
      });
      send('result', { id: run.id, from, to, summary: out.summary || '', addedModules, addedFeatures, proposals, tokens });
      send('done', {});
    } catch (e: any) {
      send('error', { message: String(e?.message || e).slice(0, 250) });
    } finally {
      clearInterval(ping);
      try { raw.end(); } catch { /* noop */ }
    }
  });

  app.get('/api/docsync', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const rows = await prisma.docSyncRun.findMany({ orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, fromDate: true, toDate: true, status: true, createdBy: true, createdAt: true, addedModules: true, addedFeatures: true } });
    return reply.send({ items: rows.map((r) => ({ ...r, modules: Array.isArray(r.addedModules) ? (r.addedModules as any[]).length : 0, features: Array.isArray(r.addedFeatures) ? (r.addedFeatures as any[]).length : 0 })) });
  });

  app.get('/api/docsync/:id', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const run = await prisma.docSyncRun.findUnique({ where: { id: String(req.params.id) } });
    if (!run) return reply.code(404).send({ error: 'not found' });
    return reply.send({ run });
  });

  // Human-gate publish: write selected proposals as NEW doc files (new folder).
  const pubSchema = z.object({ paths: z.array(z.string().max(300)).optional() });
  app.post('/api/docsync/:id/publish', async (req: any, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    const parsed = pubSchema.safeParse(req.body || {});
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const run = await prisma.docSyncRun.findUnique({ where: { id: String(req.params.id) } });
    if (!run) return reply.code(404).send({ error: 'not found' });
    const proposals: any[] = Array.isArray(run.proposals) ? (run.proposals as any[]) : [];
    const want = parsed.data.paths;
    const written: string[] = [];
    for (const p of proposals) {
      if (want && !want.includes(p.path)) continue;
      // safety: must stay under documentation/product/updates and end with .md
      const rel = String(p.path || '');
      if (!/^product\/updates\/[\w./-]+\.md$/.test(rel) || rel.includes('..')) continue;
      const abs = path.join(DOCROOT, rel);
      if (!abs.startsWith(DOCROOT)) continue;
      try {
        await fs.promises.mkdir(path.dirname(abs), { recursive: true });
        const stamp = `\n\n---\n_DocSync ${run.fromDate}→${run.toDate} · ${user.name} · ${new Date().toISOString().slice(0, 10)}_\n`;
        await fs.promises.writeFile(abs, String(p.bodyMd || '') + stamp, 'utf8');
        p.applied = true; written.push(rel);
      } catch { /* skip */ }
    }
    const publishedPaths = [...new Set([...(Array.isArray(run.publishedPaths) ? (run.publishedPaths as string[]) : []), ...written])];
    await prisma.docSyncRun.update({ where: { id: run.id }, data: { proposals, publishedPaths, status: publishedPaths.length ? 'published' : run.status } });
    return reply.send({ written, publishedPaths });
  });
}
