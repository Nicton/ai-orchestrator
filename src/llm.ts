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

export async function runRolePrompt(
  role: string,
  prompt: string,
  model?: string,
  onDelta?: (text: string) => void,
): Promise<LlmResult> {
  // Единственный движок генерации ответов — Claude Code CLI. ChatGPT/OpenAI из схемы
  // ответов исключён. Никогда не бросает — возвращает движок + диагностический лог.
  // onDelta (если передан) получает текст ответа по мере генерации (stream-json).
  const diag: string[] = [];
  try {
    const r = await runClaudeCli(role, prompt, model, onDelta);
    diag.push(`claude (${r.model}): ${r.text && r.text.trim() ? `ok, ${r.text.length} chars` : 'empty output'}`);
    if (r.text && r.text.trim()) return { ...r, engine: 'claude', diag };
  } catch (e: any) {
    diag.push(`claude: FAILED — ${String(e?.message || e).slice(0, 300)}`);
  }
  return { text: '', model: model || config.model, engine: 'none', diag };
}

function runClaudeCli(role: string, prompt: string, model?: string, onDelta?: (text: string) => void): Promise<LlmResult> {
  const useModel = model || config.model;
  const streaming = typeof onDelta === 'function';

  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--system-prompt', `You are acting as this role: ${role}`,
      '--output-format', streaming ? 'stream-json' : 'json',
      '--model', useModel,
    ];
    // В стрим-режиме просим построчный JSON с инкрементальными дельтами текста.
    if (streaming) args.push('--verbose', '--include-partial-messages');

    const proc = spawn('claude', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let buf = '';
    let finalResult: any = null;

    const handleLine = (line: string) => {
      const s = line.trim();
      if (!s) return;
      let obj: any;
      try { obj = JSON.parse(s); } catch { return; }
      if (obj.type === 'stream_event' && obj.event?.type === 'content_block_delta' && obj.event.delta?.type === 'text_delta') {
        const txt = obj.event.delta.text;
        if (txt && onDelta) { try { onDelta(txt); } catch { /* ignore consumer errors */ } }
      } else if (obj.type === 'result') {
        finalResult = obj;
      }
    };

    proc.stdout.on('data', (chunk: Buffer) => {
      const str = chunk.toString();
      if (streaming) {
        buf += str;
        let nl: number;
        while ((nl = buf.indexOf('\n')) >= 0) {
          handleLine(buf.slice(0, nl));
          buf = buf.slice(nl + 1);
        }
      } else {
        stdout += str;
      }
    });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code: number | null) => {
      if (streaming && buf.trim()) handleLine(buf);
      if (code !== 0) {
        reject(new Error(`claude CLI exited with code ${code}: ${stderr.trim()}`));
        return;
      }

      if (streaming) {
        if (!finalResult) { resolve({ text: '', model: useModel }); return; }
        if (finalResult.is_error) {
          reject(new Error(`claude CLI error: ${finalResult.result || stderr.trim()}`));
          return;
        }
        resolve({
          text: finalResult.result ?? '',
          model: finalResult.modelUsage ? Object.keys(finalResult.modelUsage)[0] || useModel : useModel,
          promptTokens: finalResult.usage?.input_tokens,
          completionTokens: finalResult.usage?.output_tokens,
          totalTokens:
            typeof finalResult.usage?.input_tokens === 'number' && typeof finalResult.usage?.output_tokens === 'number'
              ? finalResult.usage.input_tokens + finalResult.usage.output_tokens
              : undefined,
        });
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
