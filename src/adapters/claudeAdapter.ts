import type { LlmAdapter, AdapterPollResult, AdapterSessionRef, AdapterStartParams, AdapterStartResult } from './types.js';
import { newEventId, nowIso, type OrchestratorEvent } from '../bus/events.js';

export class ClaudeAdapter implements LlmAdapter {
  kind: 'claude' = 'claude';

  async start(params: AdapterStartParams): Promise<AdapterStartResult> {
    const session: AdapterSessionRef = { adapter: 'claude', sessionId: `claude_local_${Date.now()}` };

    const events: OrchestratorEvent[] = [
      {
        id: newEventId(),
        ts: nowIso(),
        type: 'run.status',
        runId: params.runId,
        stageId: params.stageId,
        status: 'queued',
        message: 'ClaudeAdapter.start (not wired yet)',
        llm: { provider: 'anthropic' },
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
          message: 'ClaudeAdapter.poll (not wired yet)',
        },
      ],
    };
  }

  async cancel(_session: AdapterSessionRef): Promise<void> {
    // no-op for skeleton
  }
}
