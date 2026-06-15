import fs from 'node:fs';

function readFileTrim(filePath?: string) {
  const p = String(filePath || '').trim();
  if (!p) return '';
  try {
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return '';
  }
}

export const config = {
  port: Number(process.env.APP_PORT || 4321),
  llmProvider: 'anthropic' as const,
  model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  answerModel: process.env.ANSWER_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  workerPollMs: Number(process.env.WORKER_POLL_MS || 2000),
  callbackTimeoutMs: Number(process.env.CALLBACK_TIMEOUT_MS || 10000),

  // Speech-to-text (Whisper).
  stt: {
    openaiApiKey: (process.env.OPENAI_API_KEY || '').trim() || readFileTrim(process.env.OPENAI_API_KEY_FILE),
    baseUrl: process.env.STT_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.STT_MODEL || 'whisper-1',
  },

  youtrack: {
    enabled: !['0', 'false', 'no', 'off', ''].includes(String(process.env.YOUTRACK_ENABLED ?? '0').toLowerCase()),
    baseUrl: process.env.YOUTRACK_BASE_URL || '',
    tokenFile: process.env.YOUTRACK_TOKEN_FILE || '',
    token: process.env.YOUTRACK_TOKEN || '',
    pollMs: Number(process.env.YOUTRACK_POLL_MS || 60000),
    webhookSecret: process.env.YOUTRACK_WEBHOOK_SECRET || '',
    query: process.env.YOUTRACK_QUERY || 'State: {To Do} summary: "[AI]"',
  },
};
