import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
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

export async function runRolePrompt(role: string, prompt: string, model?: string): Promise<LlmResult> {
  if (String(process.env.MOCK_LLM || '').trim() === '1') {
    return {
      text: JSON.stringify({ summary: `[MOCK] role=${role}`, artifacts: [], next: [] }, null, 2),
      model: 'mock',
    };
  }

  return runClaudeCli(role, prompt, model);
}

function runClaudeCli(role: string, prompt: string, model?: string): Promise<LlmResult> {
  const useModel = model || config.model;
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--system-prompt', `You are acting as this role: ${role}`,
      '--output-format', 'json',
      '--model', useModel,
    ];

    const proc = spawn('claude', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`claude CLI exited with code ${code}: ${stderr.trim()}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        if (parsed.is_error) {
          reject(new Error(`claude CLI error: ${parsed.result || stderr.trim()}`));
          return;
        }
        resolve({ text: parsed.result ?? stdout.trim(), model: useModel });
      } catch {
        resolve({ text: stdout.trim(), model: useModel });
      }
    });

    proc.on('error', (err: Error) => {
      reject(new Error(`Failed to spawn claude CLI: ${err.message}`));
    });
  });
}

// Server-side speech-to-text. Primary production path is Whisper via the
// OpenAI-compatible /audio/transcriptions API (config.stt). Browser speech is
// not the production path. Falls back to a mock only when MOCK_LLM=1.
export async function transcribeAudioFile(filePath: string, languageHint?: string): Promise<TranscriptionResult> {
  if (String(process.env.MOCK_LLM || '').trim() === '1') {
    return { text: 'This is a mock transcription of the recorded question.', model: 'mock', language: languageHint };
  }

  const { openaiApiKey, baseUrl, model } = config.stt;
  if (!openaiApiKey) {
    const err: any = new Error(
      'Speech-to-text is not configured. Set OPENAI_API_KEY (Whisper) or run with MOCK_LLM=1.',
    );
    err.statusCode = 503;
    throw err;
  }

  const buffer = await fs.promises.readFile(filePath);
  const filename = path.basename(filePath) || 'audio.webm';

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(buffer)]), filename);
  form.append('model', model);
  if (languageHint) form.append('language', languageHint);

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiApiKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Whisper transcription failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data: any = await res.json();
  return { text: String(data.text || '').trim(), model, language: data.language || languageHint };
}
