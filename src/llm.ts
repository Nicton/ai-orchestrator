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
  engine?: 'claude' | 'openai' | 'none';
  diag?: string[];
};

export type TranscriptionResult = {
  text: string;
  model: string;
  language?: string;
};

export async function runRolePrompt(role: string, prompt: string, model?: string): Promise<LlmResult> {
  // Prefer the Claude CLI when present; fall back to the OpenAI chat API (e.g. in
  // containers without the CLI). Never throws — returns a diagnostic log so the
  // caller can record WHY the LLM produced (or failed to produce) an answer.
  const diag: string[] = [];
  const ts = () => '';
  try {
    const r = await runClaudeCli(role, prompt, model);
    diag.push(`claude (${r.model}): ${r.text && r.text.trim() ? `ok, ${r.text.length} chars` : 'empty output'}`);
    if (r.text && r.text.trim()) return { ...r, engine: 'claude', diag };
  } catch (e: any) {
    diag.push(`claude: FAILED — ${String(e?.message || e).slice(0, 300)}`);
  }
  try {
    const o = await runOpenAiChat(role, prompt);
    diag.push(`openai (${o.model}): ${o.text && o.text.trim() ? `ok, ${o.text.length} chars` : 'empty output'}`);
    return { ...o, engine: 'openai', diag };
  } catch (e: any) {
    diag.push(`openai: FAILED — ${String(e?.message || e).slice(0, 300)}`);
  }
  return { text: '', model: model || config.model, engine: 'none', diag };
}

async function runOpenAiChat(role: string, prompt: string): Promise<LlmResult> {
  const apiKey = config.chat.openaiApiKey;
  if (!apiKey) throw new Error('No LLM engine available (no Claude CLI, no OpenAI key)');
  const res = await fetch(`${config.chat.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.chat.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: `You are acting as this role: ${role}` },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenAI chat failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data: any = await res.json();
  return {
    text: String(data.choices?.[0]?.message?.content || '').trim(),
    model: data.model || config.chat.model,
    promptTokens: data.usage?.prompt_tokens,
    completionTokens: data.usage?.completion_tokens,
    totalTokens: data.usage?.total_tokens,
  };
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

        resolve({
          text: parsed.result ?? stdout.trim(),
          model: parsed.modelUsage ? Object.keys(parsed.modelUsage)[0] || useModel : useModel,
          promptTokens: parsed.usage?.input_tokens,
          completionTokens: parsed.usage?.output_tokens,
          totalTokens:
            typeof parsed.usage?.input_tokens === 'number' && typeof parsed.usage?.output_tokens === 'number'
              ? parsed.usage.input_tokens + parsed.usage.output_tokens
              : undefined,
        });
      } catch {
        resolve({ text: stdout.trim(), model: useModel });
      }
    });

    proc.on('error', (err: Error) => {
      reject(new Error(`Failed to spawn claude CLI: ${err.message}`));
    });
  });
}

function readSecretFile(filePath?: string) {
  const p = String(filePath || '').trim();
  if (!p) return '';
  try {
    return fs.readFileSync(p, 'utf8').trim();
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

export async function transcribeAudioFile(filePath: string, languageHint?: string): Promise<TranscriptionResult> {
  const apiKey = getOpenAiApiKey();
  const fileBuffer = await fs.promises.readFile(filePath);
  const filename = path.basename(filePath) || 'audio.webm';

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(fileBuffer)]), filename);
  form.append('model', config.stt.model);
  if (languageHint) form.append('language', languageHint);

  const res = await fetch(`${config.stt.baseUrl.replace(/\/$/, '')}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Whisper transcription failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data: any = await res.json();
  return {
    text: String(data.text || '').trim(),
    model: data.model || config.stt.model,
    language: data.language || languageHint,
  };
}
