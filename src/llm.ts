import { spawn } from 'node:child_process';
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

export async function runRolePrompt(role: string, prompt: string): Promise<LlmResult> {
  if (String(process.env.MOCK_LLM || '').trim() === '1') {
    return {
      text: JSON.stringify({ summary: `[MOCK] role=${role}`, artifacts: [], next: [] }, null, 2),
      model: 'mock',
    };
  }

  return runClaudeCli(role, prompt);
}

function runClaudeCli(role: string, prompt: string): Promise<LlmResult> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--system-prompt', `You are acting as this role: ${role}`,
      '--output-format', 'json',
      '--model', config.model,
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
        resolve({ text: parsed.result ?? stdout.trim(), model: config.model });
      } catch {
        resolve({ text: stdout.trim(), model: config.model });
      }
    });

    proc.on('error', (err: Error) => {
      reject(new Error(`Failed to spawn claude CLI: ${err.message}`));
    });
  });
}

export async function transcribeAudioFile(_filePath: string): Promise<TranscriptionResult> {
  if (String(process.env.MOCK_LLM || '').trim() === '1') {
    return { text: '[MOCK] transcription', model: 'mock' };
  }
  throw new Error('Audio transcription is not supported with Claude Code CLI.');
}
