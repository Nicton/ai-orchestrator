export type RunStatus = 'queued' | 'running' | 'waiting' | 'stopped' | 'failed' | 'completed';
export type ResultKind = 'success' | 'fail' | 'skipped' | 'partial' | 'no-data';

export type ActorRef = {
  kind: 'agent' | 'system' | 'user';
  id: string;
  name?: string;
};

export type ToolCall = {
  tool: string;
  input?: unknown;
  startedAt?: string; // ISO
  finishedAt?: string; // ISO
};

export type LlmRef = {
  provider: 'openai' | 'anthropic' | 'unknown';
  model?: string;
};

export type BaseEvent = {
  id: string;
  ts: string; // ISO
  type: string;
  runId?: string;
  stageId?: string;
  actor?: ActorRef;
  llm?: LlmRef;
  tags?: string[];
};

export type RunStatusEvent = BaseEvent & {
  type: 'run.status';
  status: RunStatus;
  message?: string;
};

export type StageStatusEvent = BaseEvent & {
  type: 'stage.status';
  status: RunStatus;
  stageName?: string;
  message?: string;
};

export type ToolEvent = BaseEvent & {
  type: 'tool.start' | 'tool.end';
  call: ToolCall;
};

export type LogEvent = BaseEvent & {
  type: 'log';
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
};

export type ResultEvent = BaseEvent & {
  type: 'stage.result';
  result: {
    kind: ResultKind;
    summary?: string;
    rawText?: string;
    artifacts?: Array<{ kind: string; name?: string; contentType?: string; text?: string; url?: string }>;
  };
};

export type OrchestratorEvent = RunStatusEvent | StageStatusEvent | ToolEvent | LogEvent | ResultEvent;

export function newEventId(prefix = 'evt'): string {
  // no deps; good enough for local dev (stable-ish, sortable)
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
