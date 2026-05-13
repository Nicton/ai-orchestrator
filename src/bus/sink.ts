import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { OrchestratorEvent } from './events.js';

// Minimal event persistence for WS1/WS2.
// We use JSONL so that separate processes (app + worker) can share a simple activity stream.
// This is intentionally lightweight; later we can move to Postgres.

const defaultPath = process.env.ORCH_EVENT_LOG_PATH || 'data/events.jsonl';

export function eventLogPath(): string {
  return defaultPath;
}

export function appendEvent(event: OrchestratorEvent): void {
  const p = eventLogPath();
  const dir = path.dirname(p);
  if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(p, JSON.stringify(event) + '\n', 'utf8');
}

export function readRecentEvents(limit = 200): OrchestratorEvent[] {
  const p = eventLogPath();
  if (!existsSync(p)) return [];
  const raw = readFileSync(p, 'utf8');
  const lines = raw.split(/\n/).filter(Boolean);
  const tail = lines.slice(Math.max(0, lines.length - limit));
  const out: OrchestratorEvent[] = [];
  for (const line of tail) {
    try {
      out.push(JSON.parse(line));
    } catch {
      // skip bad line
    }
  }
  return out;
}
