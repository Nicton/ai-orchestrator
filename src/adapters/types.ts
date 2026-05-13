import type { OrchestratorEvent } from '../bus/events.js';

export type AdapterKind = 'openai' | 'claude';

export type AdapterSessionRef = {
  adapter: AdapterKind;
  sessionId: string;
};

export type AdapterStartParams = {
  runId: string;
  stageId?: string;
  title?: string;
  inputText: string;
  roleOrSkill?: string;
  // free-form knobs for provider-specific tuning
  options?: Record<string, unknown>;
};

export type AdapterStartResult = {
  session: AdapterSessionRef;
  // optional immediate events (e.g. queued)
  events?: OrchestratorEvent[];
};

export type AdapterPollResult = {
  done: boolean;
  events: OrchestratorEvent[];
  // final raw output (provider native / text). Optional until done=true.
  outputText?: string;
};

export interface LlmAdapter {
  kind: AdapterKind;
  start(params: AdapterStartParams): Promise<AdapterStartResult>;
  poll(session: AdapterSessionRef): Promise<AdapterPollResult>;
  cancel(session: AdapterSessionRef): Promise<void>;
}
