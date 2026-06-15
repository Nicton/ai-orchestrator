import fs from 'node:fs';
import path from 'node:path';
import fetch from 'node-fetch';
import { config } from './config.js';

export type LlmResult = {
  text: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type TranscriptionResult = {
  text: string;
  model: string;
  language?: string;
};

function readSecretFile(filePath?: string) {
  if (!filePath) return '';
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return '';
  }
}

function getOpenAiApiKey() {
  const direct = String(process.env.OPENAI_API_KEY || '').trim();
  if (direct) return direct;

  const fromFile = readSecretFile(process.env.OPENAI_API_KEY_FILE);
  if (fromFile) {
    process.env.OPENAI_API_KEY = fromFile;
    return fromFile;
  }

  throw new Error('OPENAI_API_KEY is not configured');
}

async function openAiRequest(url: string, init: Parameters<typeof fetch>[1]) {
  const apiKey = getOpenAiApiKey();
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI API ${res.status}: ${body || res.statusText}`);
  }

  return res;
}

export async function runRolePrompt(role: string, prompt: string): Promise<LlmResult> {
  const res = await openAiRequest('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: `You are acting as this role: ${role}` },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error(`OpenAI chat completion returned empty content for role=${role}`);
  }

  return {
    text,
    model: data?.model || config.model,
    promptTokens: data?.usage?.prompt_tokens,
    completionTokens: data?.usage?.completion_tokens,
    totalTokens: data?.usage?.total_tokens,
  };
}

export async function transcribeAudioBuffer(
  fileBuffer: Buffer,
  filename: string,
): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append('model', 'whisper-1');
  form.append('file', new Blob([new Uint8Array(fileBuffer)]), path.basename(filename));

  const res = await openAiRequest('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    body: form as any,
  });

  const data: any = await res.json();
  const text = String(data?.text || '').trim();
  if (!text) {
    throw new Error('OpenAI transcription returned empty text');
  }

  return {
    text,
    model: data?.model || 'whisper-1',
    language: data?.language,
  };
}

export async function transcribeAudioFile(filePath: string): Promise<TranscriptionResult> {
  const fileBuffer = await fs.promises.readFile(filePath);
  return transcribeAudioBuffer(fileBuffer, filePath);
}
