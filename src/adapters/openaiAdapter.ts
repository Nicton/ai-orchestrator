import type { LlmAdapter, AdapterPollResult, AdapterSessionRef, AdapterStartParams, AdapterStartResult } from './types.js';
import { newEventId, nowIso, type OrchestratorEvent } from '../bus/events.js';

// NOTE: This is a thin adapter skeleton. The current worker uses `src/llm.ts` directly.
// WS1 goal is to standardize the event + adapter surface; wiring comes in the next step.

export class OpenAIAdapter implements LlmAdapter {
  kind: 'openai' = 'openai';

  async start(params: AdapterStartParams): Promise<AdapterStartResult> {
    const session: AdapterSessionRef = { adapter: 'openai', sessionId: `openai_local_${Date.now()}` };

    const events: OrchestratorEvent[] = [
      {
        id: newEventId(),
        ts: nowIso(),
        type: 'run.status',
        runId: params.runId,
        stageId: params.stageId,
        status: 'queued',
        message: 'OpenAIAdapter.start (not wired yet)',
        llm: { provider: 'openai' },
      },
    ];

    return { session, events };
  }

  async poll(_session: AdapterSessionRef): Promise<AdapterPollResult> {
    return {
      done: false,
      events: [
        {
          id: newEventId(),
          ts: nowIso(),
          type: 'log',
          level: 'debug',
          message: 'OpenAIAdapter.poll (not wired yet)',
        },
      ],
    };
  }

  async cancel(_session: AdapterSessionRef): Promise<void> {
    // no-op for skeleton
  }
}
