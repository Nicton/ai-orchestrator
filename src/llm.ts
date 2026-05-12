import OpenAI from 'openai';
import { readFileSync } from 'node:fs';
import { config } from './config.js';

export type LlmResult = {
  text: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export async function runRolePrompt(role: string, prompt: string): Promise<LlmResult> {
  const apiKey = config.openaiApiKey || (config.openaiApiKeyFile ? readFileSync(config.openaiApiKeyFile, 'utf8').trim() : '');
  if (!apiKey) {
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
