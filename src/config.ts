export const config = {
  port: Number(process.env.APP_PORT || 4321),
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  transcribeModel: process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiApiKeyFile: process.env.OPENAI_API_KEY_FILE || '',
  workerPollMs: Number(process.env.WORKER_POLL_MS || 2000),
  callbackTimeoutMs: Number(process.env.CALLBACK_TIMEOUT_MS || 10000),

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
