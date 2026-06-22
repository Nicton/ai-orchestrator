import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from './config.js';
import { runRolePrompt } from './llm.js';
import { requireAuth } from './auth.js';
import { logFeatureUsage } from './usage.js';

// ---------------------------------------------------------------------------
// AI Pre-planning (Pre-planning Automation), per spec v1.0.
// Given Jira ticket IDs → grounded analysis (SMART, steps, risks, open
// questions, acceptance checklist, happy path, QA estimate) using graph.json +
// spec layer + Jira context → human review gate → write description + 3
// comments + Original Estimate to Jira. Never writes without approval.
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
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json (e.g. 204) */ }
  if (!res.ok) {
    const msg = json?.errorMessages?.join('; ') || (json?.errors && JSON.stringify(json.errors)) || text.slice(0, 300);
    throw new Error(`Jira ${res.status}: ${msg}`);
  }
  return json;
}

// --- Knowledge graph (cached) ---
let graphCache: { at: number; nodes: any; edges: any[]; byId: Map<string, any>; adj: Map<string, Array<[string, string]>> } | null = null;
function loadGraph() {
  const p = path.resolve(process.cwd(), 'workspaces/documentation/product/tools/graph.json');
  let stat: fs.Stats | null = null;
  try { stat = fs.statSync(p); } catch { return null; }
  if (graphCache && graphCache.at === stat.mtimeMs) return graphCache;
  const g = JSON.parse(fs.readFileSync(p, 'utf8'));
  const byId = new Map<string, any>();
  for (const [group, items] of Object.entries(g.nodes || {})) {
    for (const [id, node] of Object.entries(items as Record<string, any>)) byId.set(`${group}:${id}`, { group, id, ...node });
  }
  // adjacency: id (group:id form not stored on edges; edges use prefixed ids like "doc:x","api:GET /y")
  const adj = new Map<string, Array<[string, string]>>();
  for (const e of g.edges || []) {
    const [from, type, to] = e;
    if (!adj.has(from)) adj.set(from, []);
    if (!adj.has(to)) adj.set(to, []);
    adj.get(from)!.push([type, to]);
    adj.get(to)!.push([type, from]);
  }
  graphCache = { at: stat.mtimeMs, nodes: g.nodes, edges: g.edges || [], byId, adj };
  return graphCache;
}

const STOP = new Set(['the','and','for','with','from','this','that','add','adapt','api','new','fix','when','must','not','your','our','into','via','per','use','using','should']);
function keywords(text: string): string[] {
  const freq = new Map<string, number>();
  for (const w of String(text).toLowerCase().match(/[a-z0-9_./-]{3,}/gi) || []) {
    if (STOP.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 12);
}

// Find graph nodes matching ticket keywords + their first-degree neighbours; flag cross-domain.
function graphContextFor(text: string, domains: string[]): { summary: string; crossDomain: string[]; apiTouched: string[] } {
  const g = loadGraph();
  if (!g) return { summary: '(graph.json unavailable)', crossDomain: [], apiTouched: [] };
  const kw = keywords(text);
  const matched: string[] = [];
  for (const [edgeId] of g.adj) {
    const low = edgeId.toLowerCase();
    if (kw.some((k) => low.includes(k))) matched.push(edgeId);
    if (matched.length >= 18) break;
  }
  const lines: string[] = [];
  const crossDomain = new Set<string>();
  const apiTouched = new Set<string>();
  const domainOf = (id: string) => (g.byId.get(id.replace(':', ':'))?.domain) || (id.split(':')[0]);
  for (const id of matched.slice(0, 12)) {
    if (id.startsWith('api:')) apiTouched.add(id.slice(4));
    const neigh = (g.adj.get(id) || []).slice(0, 6).map(([t, to]) => `${t}→${to}`);
    lines.push(`- ${id}${neigh.length ? `  [${neigh.join(', ')}]` : ''}`);
    for (const [, to] of g.adj.get(id) || []) {
      const a = id.split(':')[0]; const b = to.split(':')[0];
      if (a !== b && ['doc', 'module', 'api', 'screen', 'requirement', 'feature'].includes(b)) { /* same graph layer, skip */ }
    }
  }
  // cross-domain: compare module domains among matched doc nodes
  return {
    summary: lines.length ? lines.join('\n') : '(no graph nodes matched ticket keywords)',
    crossDomain: [...crossDomain],
    apiTouched: [...apiTouched],
  };
}

// Lightweight spec evidence: top matching spec files by keyword overlap.
function specEvidence(text: string): string {
  const root = path.resolve(process.cwd(), 'workspaces/documentation/product/specs');
  let files: string[] = [];
  const walk = (d: string) => {
    let ents: fs.Dirent[] = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.name.endsWith('.md')) files.push(fp);
    }
  };
  walk(root);
  if (!files.length) return '(spec layer unavailable)';
  const kw = keywords(text);
  const scored = files.map((f) => {
    const rel = f.replace(root + path.sep, '').split(path.sep).join('/').toLowerCase();
    let s = kw.reduce((acc, k) => acc + (rel.includes(k) ? 3 : 0), 0);
    return { f, rel, s };
  }).sort((a, b) => b.s - a.s).filter((x) => x.s > 0).slice(0, 3);
  if (!scored.length) return '(no spec files matched ticket keywords)';
  const out: string[] = [];
  for (const { f, rel } of scored) {
    let body = '';
    try { body = fs.readFileSync(f, 'utf8').replace(/^---[\s\S]*?---\n/, ''); } catch { /* skip */ }
    out.push(`### spec: product/specs/${rel}\n${body.slice(0, 1400)}`);
  }
  return out.join('\n\n');
}

function classifyDomains(text: string): string[] {
  const t = text.toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/webhook|\bwh\b/, 'integrations.webhook'], [/\bapi\b|endpoint|\bget \/|\bpost \/|\bput \/|\bpatch \//, 'api'],
    [/attachment|document|\bmd\b|smartlist/, 'tms.features'], [/\bqr\b|quote|carrier/, 'tms.booking'],
    [/booking/, 'tms.booking'], [/invoic|accounting|billing/, 'tms.invoicing'],
    [/dock|driver|truck|slot/, 'dock'], [/shipment|tracking|tms/, 'tms.shipments'],
    [/back.?office|\bbo\b/, 'back-office'], [/admin/, 'admin-app'], [/integration|teliae|edifact|sap|ups|dhl/, 'integrations'],
  ];
  const found = new Set<string>();
  for (const [re, d] of map) if (re.test(t)) found.add(d);
  if (!found.size) found.add('tms');
  return [...found];
}

// Jira description (v2 wiki markup) for a string; comment uses same.
function adfToText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(adfToText).join('');
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (node.content) { const inner = adfToText(node.content); return /paragraph|heading|listItem|bulletList|orderedList/.test(node.type) ? inner + '\n' : inner; }
  return '';
}

async function fetchTicket(key: string) {
  const f = 'summary,description,comment,labels,priority,status,issuetype,parent,issuelinks,timetracking';
  const data = await jiraFetch('GET', `/rest/api/2/issue/${encodeURIComponent(key)}?fields=${f}`);
  const fields = data.fields || {};
  const comments = (fields.comment?.comments || []).map((c: any) => ({ author: c.author?.displayName, body: typeof c.body === 'string' ? c.body : adfToText(c.body) }));
  const links = (fields.issuelinks || []).map((l: any) => {
    const out = l.outwardIssue ? `${l.type?.outward} ${l.outwardIssue.key}` : '';
    const inn = l.inwardIssue ? `${l.type?.inward} ${l.inwardIssue.key}` : '';
    return out || inn;
  }).filter(Boolean);
  return {
    key,
    summary: fields.summary || '',
    description: typeof fields.description === 'string' ? fields.description : adfToText(fields.description),
    comments,
    labels: fields.labels || [],
    priority: fields.priority?.name || '',
    status: fields.status?.name || '',
    issuetype: fields.issuetype?.name || '',
    parent: fields.parent?.key || null,
    links,
  };
}

function hoursOf(est: string): number {
  let h = 0;
  for (const m of String(est).matchAll(/(\d+(?:\.\d+)?)\s*([dhm])/gi)) {
    const n = parseFloat(m[1]); const u = m[2].toLowerCase();
    h += u === 'd' ? n * 8 : u === 'h' ? n : n / 60;
  }
  return h;
}

// Assemble the Jira-wiki output (Section 6 structure) from the LLM analysis.
function assemble(a: any, t: any) {
  const li = (arr: any[]) => (arr || []).map((x) => `* ${typeof x === 'string' ? x : x.q || ''}`).join('\n');
  const num = (arr: any[]) => (arr || []).map((x, i) => `# ${typeof x === 'string' ? x.replace(/^\d+\.\s*/, '') : x}`).join('\n');
  const s = a.smart || {};
  const steps = a.preplanningSteps || {};
  const grp = (title: string, arr: any[]) => (arr && arr.length ? `*${title}:*\n${num(arr)}\n` : '');
  const description = [
    'h3. SMART',
    `*S — Specific:* ${s.s || ''}`,
    `*M — Measurable:*\n${(s.m || []).map((x: string) => `* ${x}`).join('\n')}`,
    `*A — Achievable:* ${s.a || ''}`,
    `*R — Relevant:* ${s.r || ''}`,
    `*T — Time-bound:* ${s.t || ''}`,
    '',
    'h3. Pre-planning steps',
    grp('Analysis', steps.analysis), grp('Backend', steps.backend), grp('Frontend', steps.frontend), grp('API Docs', steps.api), grp('QA', steps.qa),
    'h3. Risks',
    (a.risks || []).map((r: any) => `* *${r.label}:* ${r.detail || ''} — _mitigation:_ ${r.mitigation || ''}`).join('\n') || '* None identified',
    '',
    'h3. Open questions',
    (a.openQuestions || []).map((q: any) => `* ${q.q} _(owner: ${q.owner || 'TBD'})_`).join('\n') || '* None',
    '',
    'h3. Linked tickets',
    [t.parent ? `* Epic/parent: ${t.parent}` : '', ...(t.links || []).map((l: string) => `* ${l}`)].filter(Boolean).join('\n') || '* None',
  ].filter((x) => x !== '').join('\n');

  const comment1 = ['h3. Non-critical for execution — additional context', ...(a.additionalContext || []).map((x: string) => `* ${x}`),
    a.sources?.length ? `\n_Sources:_ ${a.sources.join(', ')}` : ''].join('\n');
  const comment2 = ['h3. Acceptance checklist — QA verification', num(a.acceptanceChecklist)].join('\n');
  const comment3 = ['h3. Happy path — step-by-step verification', num(a.happyPath)].join('\n');
  return { description, comment1, comment2, comment3, originalEstimate: a.qaEstimate || '' };
}

async function analyzeOne(
  ticketKey: string,
  assignee: string,
  onStage?: (m: string) => void,
  onDelta?: (text: string) => void,
) {
  onStage?.('📥 fetching from Jira…');
  const t = await fetchTicket(ticketKey);
  onStage?.('🧭 classifying domain…');
  const domains = classifyDomains(`${t.summary} ${t.description} ${t.labels.join(' ')}`);
  onStage?.(`🕸 querying knowledge graph (domains: ${domains.join(', ')})…`);
  const gc = graphContextFor(`${t.summary} ${t.description} ${t.labels.join(' ')}`, domains);
  onStage?.('📚 loading spec evidence…');
  const spec = specEvidence(`${t.summary} ${t.description}`);

  const prompt = `You are a senior QA engineer doing sprint pre-planning for Shiptify (TMS/logistics SaaS). Produce a grounded pre-planning analysis for ONE Jira ticket, IN ENGLISH. Ground EVERY claim in the provided graph nodes / spec excerpts / ticket — never invent endpoints, tables, or flows not present. Cite sources by graph id or spec path.

Return ONLY a JSON object (no prose, no code fences):
{
 "smart": {"s":"specific: name concrete module/endpoint/entity","m":["binary pass/fail criterion","..."],"a":"achievable; note precedent or decomposition if >5d/3+ modules","r":"relevant: user role + business outcome + client label","t":"time-bound: sprint + QA estimate"},
 "preplanningSteps": {"analysis":["..."],"backend":["..."],"frontend":["..."],"api":["..."],"qa":["..."]},
 "risks": [{"label":"DB Migration|API Breaking Change|Webhook Compatibility|Regression Risk|Scope Unclear|Cross-domain Impact|Performance|Blocked","detail":"...","mitigation":"..."}],
 "openQuestions": [{"q":"...","owner":"Erwan|PM|<name>"}],
 "acceptanceChecklist": ["atomic pass/fail check; last 1-2 cover regression of adjacent screens/APIs","..."],
 "happyPath": ["login as <role> on BLU","navigate ...","expected ..."],
 "additionalContext": ["non-critical background / history / references"],
 "size": "XS|S|M|L",
 "qaEstimate": "Jira time e.g. 2h / 1d (base size + modifiers)",
 "qaEstimateHours": <number>,
 "decompose": false,
 "subtasks": [{"name":"...","assignee":"${assignee || 'TBD'}","estimate":"2h","sprint":"Current|Next"}],
 "sources": ["graph:api:GET /x","spec:tms/.../MODULE.md"]
}

SMART rules: M ≥2 criteria, ≥1 testable via API/UI. A: flag decomposition if >5d or 3+ modules. R: ≥1 role + 1 outcome. T: must include QA estimate.
QA estimate = base (XS 30m-1h / S 1-2h / M 2-5h / L 1-3d) + modifiers (3+ screens +1h, webhook +30m, cross-domain +1h, DB migration +30m, each extra role +1h, no happy path +30m).
Risk detection: API response-shape change → API Breaking Change (additive only); webhook field → Webhook Compatibility (nullable); 3+ screens → Regression Risk; "open to proposal" → Scope Unclear (resolve with Erwan); cross-domain edge → Cross-domain Impact; "blocked by" link → Blocked.

=== TICKET ${t.key} ===
Summary: ${t.summary}
Status: ${t.status} · Priority: ${t.priority} · Type: ${t.issuetype} · Labels: ${t.labels.join(', ') || 'none'} · Parent: ${t.parent || 'none'} · Assignee(hint): ${assignee || 'n/a'}
Links: ${t.links.join('; ') || 'none'}
Description:
${(t.description || '(empty)').slice(0, 4000)}
Recent comments:
${t.comments.slice(0, 5).map((c: any) => `- ${c.author}: ${String(c.body).slice(0, 400)}`).join('\n') || 'none'}

=== DOMAINS (classified) ===
${domains.join(', ')}

=== KNOWLEDGE GRAPH — connected nodes (cite these) ===
${gc.summary}

=== SPEC LAYER — relevant excerpts (cite these) ===
${spec.slice(0, 4500)}`;

  onStage?.(`🤖 running LLM analysis (${config.answerModel})…`);
  const r = await runRolePrompt('qa.preplanning', prompt, config.answerModel, onDelta);
  if (!r.text || !r.text.trim()) throw new Error('LLM returned no analysis');
  onStage?.(`✅ analysis ready (${r.totalTokens || '?'} tokens)`);
  let parsed: any;
  let s = r.text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fence) s = fence[1].trim();
  const a = s.indexOf('{'); const b = s.lastIndexOf('}'); if (a >= 0 && b > a) s = s.slice(a, b + 1);
  parsed = JSON.parse(s);

  const assembled = assemble(parsed, t);
  return {
    key: t.key,
    summary: t.summary,
    status: t.status,
    priority: t.priority,
    labels: t.labels,
    domains,
    apiTouched: gc.apiTouched,
    analysis: parsed,
    jira: assembled,
    tokens: r.totalTokens || null,
    promptTokens: r.promptTokens || null,
    completionTokens: r.completionTokens || null,
    model: r.model,
    statusWarning: /to.?do|backlog|open/i.test(t.status) ? null : `Ticket status is "${t.status}" (spec: process only "To Do" tickets)`,
  };
}

export async function registerPreplanningApi(app: FastifyInstance) {
  app.get('/api/preplanning/config', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    return reply.send({ jiraEnabled: jiraConfig().enabled });
  });

  const analyzeSchema = z.object({ tickets: z.string().min(2) });
  app.post('/api/preplanning/analyze', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    if (!jiraConfig().enabled) return reply.code(503).send({ error: 'Jira is not configured (JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN)' });
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    // parse "TMS-2712 - Vlad" lines
    const items = parsed.data.tickets.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const m = l.match(/([A-Z][A-Z0-9]+-\d+)\s*[-–:]?\s*(.*)$/);
      return m ? { key: m[1], assignee: (m[2] || '').trim() } : null;
    }).filter(Boolean).slice(0, 15) as Array<{ key: string; assignee: string }>;
    if (!items.length) return reply.code(400).send({ error: 'No valid ticket IDs found (expected lines like "TMS-2712 - Vlad")' });

    const results = await Promise.all(items.map(async (it) => {
      try { return await analyzeOne(it.key, it.assignee); }
      catch (e: any) { return { key: it.key, error: String(e?.message || e).slice(0, 200) }; }
    }));
    for (const r of results as any[]) {
      await logFeatureUsage({
        userId: user.id, userLabel: user.name, feature: 'preplanning', action: 'analyze', ref: `${r.key}${r.summary ? ` — ${r.summary}` : ''}`,
        model: r.model, promptTokens: r.promptTokens, completionTokens: r.completionTokens, totalTokens: r.tokens,
        status: r.error ? 'error' : 'ok',
      });
    }

    const totalHours = results.reduce((s: number, r: any) => s + (r.analysis?.qaEstimateHours || hoursOf(r.jira?.originalEstimate || '') || 0), 0);
    const sprintWarning = totalHours > 80
      ? `Sprint QA load ≈ ${(totalHours / 8).toFixed(1)}d exceeds 10d capacity — consider deferring lower-priority tickets.`
      : null;
    return reply.send({ tickets: results, totalQaHours: Math.round(totalHours * 10) / 10, sprintWarning });
  });

  // Streaming analyze (SSE): per-ticket stage progress + live LLM log, then per-ticket
  // results as they finish, then a final summary. Lets the UI show a loader + log.
  app.post('/api/preplanning/analyze/stream', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    if (!jiraConfig().enabled) return reply.code(503).send({ error: 'Jira is not configured' });
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const items = parsed.data.tickets.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const m = l.match(/([A-Z][A-Z0-9]+-\d+)\s*[-–:]?\s*(.*)$/);
      return m ? { key: m[1], assignee: (m[2] || '').trim() } : null;
    }).filter(Boolean).slice(0, 15) as Array<{ key: string; assignee: string }>;
    if (!items.length) return reply.code(400).send({ error: 'No valid ticket IDs found (expected lines like "TMS-2712 - Vlad")' });

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event: string, data: any) => { try { raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* client gone */ } };
    const ping = setInterval(() => { try { raw.write(': ping\n\n'); } catch { /* noop */ } }, 15000);

    try {
      send('stage', { msg: `Тикетов к анализу: ${items.length}` });
      const results: any[] = [];
      // sequential per ticket → readable progress + live LLM log
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        send('stage', { msg: `▶ [${i + 1}/${items.length}] ${it.key}` });
        try {
          const r = await analyzeOne(
            it.key, it.assignee,
            (m) => send('stage', { msg: `   ${it.key}: ${m}` }),
            (txt) => send('delta', { key: it.key, text: txt }),
          );
          results.push(r);
          await logFeatureUsage({
            userId: user.id, userLabel: user.name, feature: 'preplanning', action: 'analyze', ref: `${r.key}${r.summary ? ` — ${r.summary}` : ''}`,
            model: r.model, promptTokens: r.promptTokens, completionTokens: r.completionTokens, totalTokens: r.tokens,
          });
          send('ticket', r);
        } catch (e: any) {
          const er = { key: it.key, error: String(e?.message || e).slice(0, 200) };
          results.push(er);
          send('ticket', er);
          send('stage', { msg: `   ${it.key}: ⚠️ ${er.error}` });
        }
      }
      const totalHours = results.reduce((s: number, r: any) => s + (r.analysis?.qaEstimateHours || hoursOf(r.jira?.originalEstimate || '') || 0), 0);
      const sprintWarning = totalHours > 80 ? `Sprint QA load ≈ ${(totalHours / 8).toFixed(1)}d exceeds 10d capacity — consider deferring lower-priority tickets.` : null;
      send('done', { totalQaHours: Math.round(totalHours * 10) / 10, sprintWarning });
    } catch (e: any) {
      send('error', { message: String(e?.message || e).slice(0, 250) });
    } finally {
      clearInterval(ping);
      try { raw.end(); } catch { /* noop */ }
    }
  });

  const applySchema = z.object({
    ticketKey: z.string().min(3).max(20),
    description: z.string().optional(),
    comment1: z.string().optional(),
    comment2: z.string().optional(),
    comment3: z.string().optional(),
    originalEstimate: z.string().max(20).optional(),
  });
  // Stage 7 — write to Jira (ONLY after human approval). Description overwrite; comments append-only.
  app.post('/api/preplanning/apply', async (req, reply) => {
    const user = await requireAuth(req, reply); if (!user) return;
    if (!jiraConfig().enabled) return reply.code(503).send({ error: 'Jira is not configured' });
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const d = parsed.data;
    const { baseUrl } = jiraConfig();
    const done: string[] = [];
    // Attribution — who generated/approved this AI pre-planning (carried into Jira).
    const by = `${user.name}${user.email ? ` (${user.email})` : ''}`;
    const stamp = `🤖 AI Pre-planning (Searchify) — сгенерировано и подтверждено: ${by} · ${new Date().toISOString().slice(0, 10)}`;
    try {
      const fields: any = {};
      // append the attribution footer to the description so it always reaches Jira
      if (d.description) fields.description = `${d.description}\n\n----\n_${stamp}_`;
      if (d.originalEstimate) fields.timetracking = { originalEstimate: d.originalEstimate };
      if (Object.keys(fields).length) { await jiraFetch('PUT', `/rest/api/2/issue/${encodeURIComponent(d.ticketKey)}`, { fields }); done.push('description/estimate'); }
      const comments = [d.comment1, d.comment2, d.comment3].filter((c) => c && c.trim()) as string[];
      // stamp the first comment too, so attribution survives even if no description was written
      comments.forEach((c, i) => { if (i === 0 && !d.description) c = `${c}\n\n_${stamp}_`; });
      const toPost = comments.length ? comments : (d.description ? [] : [`_${stamp}_`]);
      for (const c of toPost) {
        await jiraFetch('POST', `/rest/api/2/issue/${encodeURIComponent(d.ticketKey)}/comment`, { body: c });
        done.push('comment');
      }
    } catch (e: any) {
      return reply.code(502).send({ error: `Jira write failed after [${done.join(', ')}]: ${String(e?.message || e).slice(0, 250)}` });
    }
    return reply.send({ ok: true, key: d.ticketKey, url: `${baseUrl}/browse/${d.ticketKey}`, written: done });
  });
}
