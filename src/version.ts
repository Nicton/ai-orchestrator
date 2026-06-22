import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';

// ---------------------------------------------------------------------------
// Build/version info for the header badge: latest (non-merge) commit subject,
// its date, and the sequential commit number (rev-list count). Read from the
// git repo of the deployed tree (/workspace is bind-mounted on prod; cwd in dev).
// ---------------------------------------------------------------------------
function repoDir(): string | null {
  const cands = [process.env.GIT_REPO_DIR, '/workspace', process.cwd(), path.resolve(process.cwd(), '..')]
    .filter(Boolean) as string[];
  for (const d of cands) { try { if (fs.existsSync(path.join(d, '.git'))) return d; } catch { /* skip */ } }
  return null;
}
function sh(cmd: string, cwd: string): Promise<string> {
  return new Promise((resolve) => exec(cmd, { cwd, timeout: 8000 }, (err, stdout) => resolve(err ? '' : String(stdout).trim())));
}

let cache: { at: number; data: any } | null = null;

export async function registerVersionApi(app: FastifyInstance) {
  app.get('/api/version', async (_req, reply) => {
    if (cache && Date.now() - cache.at < 60000) return reply.send(cache.data);
    const dir = repoDir();
    let data: any = { number: null, subject: '', date: '', sha: '' };
    if (dir) {
      // -c safe.directory=* bypasses git's "dubious ownership" guard (the repo is
      // owned by the deploy user but the container runs as root).
      const G = "git -c safe.directory='*'";
      const number = await sh(`${G} rev-list --count HEAD`, dir);
      const line = await sh(`${G} log -1 --no-merges --format=%s%x1f%cI%x1f%h`, dir);
      const [subject, date, sha] = line.split('\x1f');
      data = {
        number: number ? Number(number) : null,
        subject: subject || '',
        date: date || '',
        sha: sha || '',
      };
    }
    cache = { at: Date.now(), data };
    return reply.send(data);
  });
}
