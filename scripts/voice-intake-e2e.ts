#!/usr/bin/env tsx

/**
 * Voice Intake E2E Smoke Script
 *
 * Usage:
 *   npx tsx scripts/voice-intake-e2e.ts --audio ./sample.wav
 *
 * Options:
 *   --baseUrl http://localhost:4321
 *   --audio   path to audio file
 *   --customerName  (default: "ACME")
 *   --timeoutSec    (default: 180)
 *   --pollMs        (default: 1000)
 *   --sync          run endpoints in sync mode (no worker needed)
 *
 * Notes:
 * - Default mode uses async jobs; requires worker running.
 * - --sync is useful for quick local smoke without worker.
 */

import fs from 'node:fs';
import path from 'node:path';

type Json = any;

function arg(name: string, fallback?: string) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return fallback;
  return v;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function die(msg: string): never {
  console.error(msg);
  process.exit(1);
}

async function fetchJson(url: string, init?: RequestInit): Promise<Json> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    (err as any).body = json;
    throw err;
  }
  return json;
}

async function uploadIntake(params: {
  baseUrl: string;
  audioPath: string;
  customerName: string;
}) {
  const abs = path.resolve(params.audioPath);
  if (!fs.existsSync(abs)) die(`Audio file not found: ${abs}`);

  const fd = new FormData();
  fd.set('customerName', params.customerName);
  fd.set('inputKind', 'voice');

  const buf = fs.readFileSync(abs);
  const filename = path.basename(abs);
  fd.set('audio', new Blob([buf]), filename);

  return fetchJson(`${params.baseUrl}/api/intake/upload`, {
    method: 'POST',
    body: fd,
  });
}

async function postStep(baseUrl: string, intakeId: string, step: string, sync: boolean) {
  const url = `${baseUrl}/api/intake/${intakeId}/${step}${sync ? '?sync=1' : ''}`;
  return fetchJson(url, { method: 'POST' });
}

async function getIntake(baseUrl: string, intakeId: string) {
  return fetchJson(`${baseUrl}/api/intake/${intakeId}`);
}

async function getJobs(baseUrl: string, intakeId: string) {
  return fetchJson(`${baseUrl}/api/intake/${intakeId}/jobs?limit=500`);
}

async function getEvents(baseUrl: string, intakeId: string) {
  return fetchJson(`${baseUrl}/api/intake/${intakeId}/events?limit=500`);
}

function isDone(intake: any) {
  return Boolean(intake?.transcript) && Boolean(intake?.questionnaire) && Boolean(intake?.requirementCard);
}

async function main() {
  const baseUrl = arg('--baseUrl', 'http://localhost:4321')!;
  const audio = arg('--audio');
  const customerName = arg('--customerName', 'ACME')!;
  const timeoutSec = Number(arg('--timeoutSec', '180'));
  const pollMs = Number(arg('--pollMs', '1000'));
  const sync = hasFlag('--sync');

  if (!audio) {
    die('Missing --audio <path>. Example: npx tsx scripts/voice-intake-e2e.ts --audio ./sample.wav');
  }

  const startedAt = Date.now();
  console.log(`[e2e] baseUrl=${baseUrl}`);
  console.log(`[e2e] audio=${audio}`);
  console.log(`[e2e] mode=${sync ? 'sync' : 'async'} timeoutSec=${timeoutSec} pollMs=${pollMs}`);

  const created = await uploadIntake({ baseUrl, audioPath: audio, customerName });
  const intakeId = String(created.id);
  console.log(`[e2e] created intakeId=${intakeId}`);

  // Steps
  const tr = await postStep(baseUrl, intakeId, 'transcribe', sync);
  console.log(`[e2e] transcribe:`, tr);

  const q = await postStep(baseUrl, intakeId, 'questionnaire', sync);
  console.log(`[e2e] questionnaire:`, q);

  const card = await postStep(baseUrl, intakeId, 'requirement-card', sync);
  console.log(`[e2e] requirement-card:`, card);

  // Poll until done
  while (true) {
    const elapsedSec = (Date.now() - startedAt) / 1000;
    if (elapsedSec > timeoutSec) {
      console.error(`[e2e] TIMEOUT after ${timeoutSec}s`);
      const intake = await getIntake(baseUrl, intakeId);
      console.error(`[e2e] intake status=${intake?.status} error=${intake?.errorMessage ?? '-'}`);
      console.error(`[e2e] jobs:`);
      console.error(JSON.stringify(await getJobs(baseUrl, intakeId), null, 2));
      console.error(`[e2e] events:`);
      console.error(JSON.stringify(await getEvents(baseUrl, intakeId), null, 2));
      process.exit(2);
    }

    const intake = await getIntake(baseUrl, intakeId);
    const status = intake?.status;

    if (intake?.status === 'ERROR' || intake?.errorMessage) {
      console.error(`[e2e] FAIL status=${status} error=${intake?.errorMessage ?? '-'}`);
      console.error(JSON.stringify({ intakeId, status, errorMessage: intake?.errorMessage }, null, 2));
      console.error(`[e2e] jobs/events for debugging:`);
      console.error(JSON.stringify(await getJobs(baseUrl, intakeId), null, 2));
      console.error(JSON.stringify(await getEvents(baseUrl, intakeId), null, 2));
      process.exit(3);
    }

    if (isDone(intake)) {
      console.log(`[e2e] OK intakeId=${intakeId} status=${status} elapsed=${elapsedSec.toFixed(1)}s`);
      console.log(
        JSON.stringify(
          {
            intakeId,
            status,
            hasTranscript: Boolean(intake?.transcript),
            hasQuestionnaire: Boolean(intake?.questionnaire),
            hasRequirementCard: Boolean(intake?.requirementCard),
          },
          null,
          2,
        ),
      );
      return;
    }

    process.stdout.write(`[e2e] waiting... status=${status} elapsed=${elapsedSec.toFixed(1)}s\r`);
    await sleep(pollMs);
  }
}

main().catch((e) => {
  console.error('[e2e] ERROR', e?.message || e);
  if ((e as any)?.body) console.error(JSON.stringify((e as any).body, null, 2));
  process.exit(1);
});
