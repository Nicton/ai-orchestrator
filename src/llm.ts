import OpenAI from 'openai';
import { readFileSync, statSync } from 'node:fs';
import { config } from './config.js';

export type LlmResult = {
  text: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export async function runRolePrompt(role: string, prompt: string): Promise<LlmResult> {
  const mock = String(process.env.MOCK_LLM || '').trim() === '1';

  let apiKey = config.openaiApiKey;
  if (!apiKey && config.openaiApiKeyFile) {
    try {
      const st = statSync(config.openaiApiKeyFile);
      if (!st.isFile()) {
        // common docker pitfall: a directory got mounted instead of a file
        apiKey = '';
      } else {
        apiKey = readFileSync(config.openaiApiKeyFile, 'utf8').trim();
      }
    } catch {
      apiKey = '';
    }
  }

  if (!apiKey) {
    if (mock) {
      return {
        text: JSON.stringify(
          {
            summary: `[MOCK] role=${role}: no OPENAI_API_KEY, returning stub result`,
            artifacts: [],
            next: [],
          },
          null,
          2,
        ),
        model: 'mock',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };
    }
    throw new Error('OPENAI_API_KEY is missing (set OPENAI_API_KEY or OPENAI_API_KEY_FILE)');
  }

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: config.model,
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: `You are acting as this role: ${role}` }],
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: prompt }],
      },
    ],
  });

  return {
    text: response.output_text || '',
    model: response.model,
    promptTokens: response.usage?.input_tokens,
    completionTokens: response.usage?.output_tokens,
    totalTokens: response.usage?.total_tokens,
  };
}
