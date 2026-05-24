# Voice → Requirement Intake (v1) — Runbook

This repo: `ai-orchestrator` (`tmp/ai-orchestrator`).

## Quick start

### 1) Env
See `.env.example`. Minimum expected for local run:
- `DATABASE_URL` (SQLite or Postgres, depending on your setup)
- `OPENAI_API_KEY`

Optional (Jira; currently stubbed unless enabled + wired):
- `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`, `JIRA_ISSUE_TYPE`

### 2) Install + DB
```bash
npm i
npx prisma db push
```

### 3) Run app + worker
Depending on how you start services in this repo, you generally need **two processes**:

```bash
# terminal A
npm run dev

# terminal B
npm run worker
```

(If scripts differ in `package.json`, adjust accordingly.)

## Current API surface (implemented)

Base path: `/api/intake`

### Create intake (text)
`POST /api/intake`
```json
{
  "customerName": "ACME",
  "inputKind": "text",
  "inputText": "We need ...",
  "customerEmail": "john@acme.com",
  "locale": "fr",
  "source": "manual"
}
```

### Create intake + upload audio (multipart)
`POST /api/intake/upload`
- multipart fields: same as create schema (strings)
- file field name: `audio`

### List intakes
`GET /api/intake?limit=50&status=RECEIVED`

### Get intake by id (includes events)
`GET /api/intake/:id`

### Get events (debug)
`GET /api/intake/:id/events?limit=200&cursor=<eventId>`

### Get jobs (debug)
`GET /api/intake/:id/jobs?limit=200`

### Transcribe
`POST /api/intake/:id/transcribe`
- default: async (202 + jobId)
- sync mode: `POST /api/intake/:id/transcribe?sync=1`

### Generate questionnaire
`POST /api/intake/:id/questionnaire`
- default: async (202 + jobId)
- sync mode: `POST /api/intake/:id/questionnaire?sync=1`

### Generate requirement card
`POST /api/intake/:id/requirement-card`
- default: async (202 + jobId)
- sync mode: `POST /api/intake/:id/requirement-card?sync=1`

### Jira link/create (async)
`POST /api/intake/:id/jira`
- currently enqueues a job; worker creates a stub Jira link row and marks intake as NEEDS_INFO unless Jira integration is fully enabled/wired.

## Smoke test: end-to-end

### Option A: script (recommended)

```bash
# async (requires worker running)
npm run e2e:voice-intake -- --audio ./sample.wav

# sync mode (no worker required)
npm run e2e:voice-intake -- --audio ./sample.wav --sync

# custom baseUrl
npm run e2e:voice-intake -- --audio ./sample.wav --baseUrl http://localhost:4321
```

### Option B: manual curl

> Goal: `upload → transcribe → questionnaire → requirement-card` and watch intake status + events.

### 0) Create + upload audio
```bash
curl -sS -X POST http://localhost:4321/api/intake/upload \
  -F customerName='ACME' \
  -F inputKind='voice' \
  -F audio=@./sample.wav
```
Response returns `id`.

### 1) Enqueue transcription
```bash
curl -sS -X POST http://localhost:4321/api/intake/<ID>/transcribe
```

### 2) Enqueue questionnaire
```bash
curl -sS -X POST http://localhost:4321/api/intake/<ID>/questionnaire
```

### 3) Enqueue requirement card
```bash
curl -sS -X POST http://localhost:4321/api/intake/<ID>/requirement-card
```

### 4) Poll intake until done
```bash
watch -n 1 "curl -sS http://localhost:4321/api/intake/<ID> | jq '{status, errorMessage, hasTranscript:(.transcript!=null), hasQuestionnaire:(.questionnaire!=null), hasCard:(.requirementCard!=null), eventsCount:(.events|length)}'"
```

## Known gaps (next work)
- Missing endpoints:
  - `GET /api/intake/:id/jobs`
  - `GET /api/intake/:id/events` (separate view; currently events are included in `GET /api/intake/:id`)
- Job idempotency: avoid creating duplicate PENDING jobs for the same `intakeId + type` under concurrent requests.
- Jira: real create/update + statuses `CREATED_IN_JIRA` / `ERROR` (vs current stub).
- Provide a small script (node/tsx) to do the full E2E automatically (instead of manual curl).
