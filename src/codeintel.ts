import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

// ---------------------------------------------------------------------------
// Shared code intelligence: given a Jira key (or keywords), find the ADDED /
// changed code across the cloned product repos in workspaces/ — even if the
// feature branch was already merged and deleted — and provide enough context
// (diff + changed files → product modules) to reason about how it works and
// what it affects. Used by code-dive (knowledge), task testing, etc.
//
// Source of truth = real git repos under workspaces/<repo> (token credential
// helper). git is read on the working tree / fetched refs; no network needed
// for the commit-message search (the merged commit is already in the clone).
// ---------------------------------------------------------------------------
export const WORKSPACES_ROOT = path.resolve(process.cwd(), 'workspaces');
export const CODE_EXT_RE = /\.(?:js|ts|jsx|tsx|mjs|cjs|vue|py)$/i;
// Repos that hold user-facing UI (for "where/how in the product" answers).
export const FRONTEND_REPOS = ['frontend-mono', 'back-office', 'admin-app', 'mini-apps', 'frontend'];

const GIT = "git -c safe.directory='*'";

export function gitSh(cmd: string, cwd: string, timeoutMs = 30000): Promise<string> {
  return new Promise((resolve) => exec(cmd, { cwd, timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (err, stdout) => resolve(err ? '' : String(stdout))));
}

// Cloned product repos (dirs with a .git), excluding the docs repo.
export function codeRepos(): string[] {
  let ents: fs.Dirent[] = [];
  try { ents = fs.readdirSync(WORKSPACES_ROOT, { withFileTypes: true }); } catch { return []; }
  return ents
    .filter((e) => e.isDirectory() && e.name !== 'documentation' && fs.existsSync(path.join(WORKSPACES_ROOT, e.name, '.git')))
    .map((e) => e.name);
}

// Changed file path → product module (best-effort, Shiptify layout).
export function moduleOf(repo: string, file: string): string {
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

export type CodeRef = {
  repo: string;
  branch: string;        // label: feature branch name OR "commit <sha> (merged)"
  kind: 'branch' | 'commit';
  base: string;
  commits: string[];
  stat: string;
  files: number;
  modules: string[];
  diff: string;
  truncated: boolean;
};

const DIFF_CAP = 16000;
function statFiles(stat: string): string[] {
  return (stat.match(/^\s*(\S[^|]*?)\s+\|/gm) || []).map((l) => l.replace(/\s*\|.*$/, '').trim()).filter(Boolean);
}

// A branch whose NAME contains the key → its three-dot diff vs the repo base.
async function branchRef(repo: string, branch: string, onStage?: (m: string) => void): Promise<CodeRef | null> {
  const cwd = path.join(WORKSPACES_ROOT, repo);
  onStage?.(`⬇️ ${repo}:${branch}…`);
  await gitSh(`${GIT} fetch origin "${branch}" --quiet`, cwd, 120000);
  let base = '';
  for (const b of ['develop', 'master', 'main']) {
    if ((await gitSh(`${GIT} rev-parse --verify --quiet origin/${b}`, cwd, 15000)).trim()) { base = b; break; }
  }
  const ref = `origin/${branch}`;
  const range = base ? `origin/${base}...${ref}` : `${ref}~5..${ref}`;
  const stat = (await gitSh(`${GIT} diff --stat ${range}`, cwd, 45000)).trim();
  const log = (await gitSh(`${GIT} log --oneline ${base ? `origin/${base}..${ref}` : `-8 ${ref}`}`, cwd, 30000)).trim();
  let diff = await gitSh(`${GIT} diff ${range}`, cwd, 60000);
  if (!stat && !diff) return null;
  const truncated = diff.length > DIFF_CAP;
  if (truncated) diff = diff.slice(0, DIFF_CAP);
  const sf = statFiles(stat);
  return { repo, branch, kind: 'branch', base: base || '(unknown)', commits: log.split('\n').filter(Boolean).slice(0, 20), stat, files: sf.length, modules: [...new Set(sf.map((f) => moduleOf(repo, f)))], diff, truncated };
}

// Commits whose MESSAGE contains the key (across all refs) → their diffs.
// Catches already-MERGED work whose branch was deleted.
async function commitRefs(key: string, onStage?: (m: string) => void, limit = 4): Promise<CodeRef[]> {
  const out: CodeRef[] = [];
  for (const repo of codeRepos()) {
    if (out.length >= limit) break;
    const cwd = path.join(WORKSPACES_ROOT, repo);
    const log = await gitSh(`${GIT} log --all -i --grep "${key}" --pretty=%H -n 3`, cwd, 30000);
    for (const sha of log.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 2)) {
      if (out.length >= limit) break;
      const subj = (await gitSh(`${GIT} log -1 --pretty=%s ${sha}`, cwd, 15000)).trim();
      const stat = (await gitSh(`${GIT} show --stat --format= ${sha}`, cwd, 30000)).trim();
      let diff = await gitSh(`${GIT} show ${sha} --no-color --format=`, cwd, 45000);
      const truncated = diff.length > DIFF_CAP;
      if (truncated) diff = diff.slice(0, DIFF_CAP);
      const sf = statFiles(stat);
      onStage?.(`🔎 ${repo}@${sha.slice(0, 9)}: ${subj.slice(0, 60)}`);
      out.push({ repo, branch: `commit ${sha.slice(0, 9)} (merged)`, kind: 'commit', base: '—', commits: [subj], stat, files: sf.length, modules: [...new Set(sf.map((f) => moduleOf(repo, f)))], diff, truncated });
    }
  }
  return out;
}

// THE mechanism: all code for a Jira key — live feature branches (by name) AND
// already-merged commits (by message). Deduped by diff.
export async function gatherCodeForKey(key: string, onStage?: (m: string) => void): Promise<CodeRef[]> {
  const refs: CodeRef[] = [];
  const repos = codeRepos();
  // 1) feature branches whose name contains the key
  await Promise.all(repos.map(async (repo) => {
    const r = await gitSh(`${GIT} ls-remote --heads origin "*${key}*"`, path.join(WORKSPACES_ROOT, repo), 45000);
    for (const line of r.split('\n')) {
      const m = line.match(/refs\/heads\/(\S+)/);
      if (m && refs.length < 6) { try { const cr = await branchRef(repo, m[1], onStage); if (cr) refs.push(cr); } catch { /* skip */ } }
    }
  }));
  // 2) merged commits referencing the key
  try {
    for (const cr of await commitRefs(key, onStage)) {
      if (refs.length >= 8) break;
      if (!refs.some((b) => b.diff && b.diff === cr.diff)) refs.push(cr);
    }
  } catch { /* best-effort */ }
  return refs;
}

export function formatCodeRefs(refs: CodeRef[], cap = 16000): string {
  if (!refs.length) return '';
  return refs.map((b) => `### ${b.repo} · ${b.branch} (base ${b.base})${b.modules.length ? ` · modules: ${b.modules.join(', ')}` : ''}
commits:
${b.commits.join('\n') || '(none)'}
changed files:
${b.stat || '(n/a)'}
diff${b.truncated ? ' (truncated)' : ''}:
\`\`\`diff
${b.diff || '(empty)'}
\`\`\``).join('\n\n').slice(0, cap);
}

// Resolve a file-path hint to an absolute file inside any code repo.
export async function resolveFile(hint: string): Promise<string | null> {
  const clean = hint.replace(/[:#].*$/, '').replace(/^[`'"(]+|[`'")]+$/g, '').trim();
  if (!clean || !CODE_EXT_RE.test(clean) || clean.includes('..')) return null;
  const norm = clean.replace(/^workspaces\//, '').replace(/^\.\//, '');
  const cands = [norm, ...codeRepos().map((r) => `${r}/${norm}`)];
  for (const c of cands) {
    const p = path.join(WORKSPACES_ROOT, c);
    if (!p.startsWith(WORKSPACES_ROOT)) continue;
    try { if ((await fs.promises.stat(p)).isFile()) return p; } catch { /* not here */ }
  }
  return null;
}

// Keyword code search (git grep, AND of distinctive terms) ranked by path
// relevance. Used by code-dive to locate UI/screens for "where/how" questions.
export async function grepCodeFiles(terms: string[], repos: string[], limit: number): Promise<string[]> {
  const clean = [...new Set(terms.filter((t) => t && t.length > 2).map((t) => t.replace(/[^A-Za-z0-9]/g, '.')))].sort((a, b) => b.length - a.length);
  if (!clean.length) return [];
  const gather = async (ts: string[]): Promise<string[]> => {
    if (!ts.length) return [];
    const eArgs = ts.map((t) => `-e "${t}"`).join(' ');
    const out: string[] = [];
    for (const repo of repos) {
      const cwd = path.join(WORKSPACES_ROOT, repo);
      try { if (!(await fs.promises.stat(path.join(cwd, '.git'))).isDirectory()) continue; } catch { continue; }
      const res = await gitSh(`${GIT} grep -lIiE --all-match ${eArgs} -- "*.js" "*.ts" "*.jsx" "*.tsx" "*.vue"`, cwd, 25000);
      for (const rel of res.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 40)) out.push(path.join(WORKSPACES_ROOT, repo, rel));
    }
    return out;
  };
  let cands: string[] = [];
  for (const n of [3, 2, 1]) { cands = await gather(clean.slice(0, n)); if (cands.length) break; }
  if (!cands.length) return [];
  const low = clean.map((t) => t.toLowerCase());
  const score = (abs: string) => {
    const rel = abs.replace(WORKSPACES_ROOT + path.sep, '').split(path.sep).join('/').toLowerCase();
    let s = 0;
    if (/api[-_]?key|apikey/.test(rel)) s += 6;
    if (/(settings|self-admin|account|profile|developer|integration|admin|token|security|credential)/.test(rel)) s += 3;
    for (const t of low) if (t.length > 2 && rel.includes(t)) s += 2;
    if (/route|router|menu|nav|page|view|screen/.test(rel)) s += 1;
    return s;
  };
  return [...new Set(cands)].sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export const JIRA_KEY_RE = /\b[A-Z][A-Z0-9]+-\d+\b/g;
