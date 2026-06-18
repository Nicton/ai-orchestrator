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

  // Object storage (MinIO/S3) for uploaded question images.
  storage: {
    endpoint: process.env.MINIO_ENDPOINT || 'minio',
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: ['1', 'true', 'yes', 'on'].includes(String(process.env.MINIO_USE_SSL || '').toLowerCase()),
    accessKey: process.env.MINIO_ROOT_USER || 'searchify',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'searchify-minio-secret',
    bucket: process.env.MINIO_BUCKET || 'searchify-uploads',
  },

  // Speech-to-text (Whisper).
  stt: {
    openaiApiKey: (process.env.OPENAI_API_KEY || '').trim() || readFileTrim(process.env.OPENAI_API_KEY_FILE),
    baseUrl: process.env.STT_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.STT_MODEL || 'whisper-1',
  },

  // LLM chat fallback (used when the Claude CLI is unavailable, e.g. inside containers).
  chat: {
    openaiApiKey: (process.env.OPENAI_API_KEY || '').trim() || readFileTrim(process.env.OPENAI_API_KEY_FILE),
    baseUrl: process.env.OPENAI_BASE_URL || process.env.STT_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
