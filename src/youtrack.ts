import fs from 'node:fs/promises';

export type YouTrackIssueLink = {
  type?: string;
  direction?: string;
  idReadable?: string;
  summary?: string;
};

export type YouTrackIssueHydrated = {
  id: string;
  idReadable: string;
  summary: string;
  description: string;
  state: string;
  links: YouTrackIssueLink[];
  comments: { id: string; text: string; created: number; author: string }[];
};

function baseUrl() {
  const raw = String(process.env.YOUTRACK_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!raw) throw new Error('YOUTRACK_BASE_URL is required');
  return raw;
}

async function loadToken() {
  const direct = String(process.env.YOUTRACK_TOKEN || '').trim();
  if (direct) return direct;
  const file = String(process.env.YOUTRACK_TOKEN_FILE || '').trim();
  if (!file) throw new Error('YOUTRACK_TOKEN or YOUTRACK_TOKEN_FILE is required');
  const token = (await fs.readFile(file, 'utf8')).trim();
  if (!token) throw new Error('YouTrack token file is empty');
  return token;
}

async function ytFetch(path: string, opts: RequestInit = {}) {
  const token = await loadToken();
  const res = await fetch(`${baseUrl()}${path}`, {
    ...opts,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err: any = new Error(json?.error || json?.message || `YouTrack HTTP ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export async function searchAiTodos() {
  const query = String(process.env.YOUTRACK_QUERY || 'State: {To Do} summary: "[AI]"');
  const fields = 'id,idReadable,summary,description,customFields(name,value(name))';
  const url = `/api/issues?query=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}`;
  return await ytFetch(url, { method: 'GET' });
}

export async function hydrateIssue(issueId: string): Promise<YouTrackIssueHydrated> {
  const fields = [
    'id',
    'idReadable',
    'summary',
    'description',
    'customFields(name,value(name))',
    'links(direction,linkType(name),issues(idReadable,summary))',
  ].join(',');

  const issue = await ytFetch(`/api/issues/${encodeURIComponent(issueId)}?fields=${encodeURIComponent(fields)}`);
  const customFields = Array.isArray(issue?.customFields) ? issue.customFields : [];
  const stateField = customFields.find((f: any) => f?.name === 'State');
  const state = String(stateField?.value?.name || stateField?.value || '').trim();

  const links: YouTrackIssueLink[] = (Array.isArray(issue?.links) ? issue.links : []).flatMap((l: any) => {
    const type = String(l?.linkType?.name || '').trim();
    const direction = String(l?.direction || '').trim();
    const issues = Array.isArray(l?.issues) ? l.issues : [];
    return issues.map((x: any) => ({
      type,
      direction,
      idReadable: x?.idReadable,
      summary: x?.summary,
    }));
  });

  const commentsFields = 'id,text,created,author(name)';
  const comments = await ytFetch(`/api/issues/${encodeURIComponent(issueId)}/comments?fields=${encodeURIComponent(commentsFields)}`, { method: 'GET' });

  return {
    id: String(issue?.id),
    idReadable: String(issue?.idReadable),
    summary: String(issue?.summary || ''),
    description: String(issue?.description || ''),
    state,
    links,
    comments: (Array.isArray(comments) ? comments : []).map((c: any) => ({
      id: String(c?.id),
      text: String(c?.text || ''),
      created: Number(c?.created || 0),
      author: String(c?.author?.name || ''),
    })),
  };
}

export async function addComment(issueId: string, text: string) {
  return await ytFetch(`/api/issues/${encodeURIComponent(issueId)}/comments?fields=id`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

// Execute a YouTrack command on an issue, e.g. "State Done".
// Works with either internal id or idReadable.
export async function executeCommand(issueIdOrReadable: string, command: string, comment?: string) {
  const query = `?fields=${encodeURIComponent('id')}`;
  return await ytFetch(`/api/issues/${encodeURIComponent(issueIdOrReadable)}/execute${query}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ command, comment: comment || undefined }),
  });
}
