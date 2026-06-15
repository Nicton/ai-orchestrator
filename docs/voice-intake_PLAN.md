# Voice → Requirement Intake (v1) — Execution Plan

Source spec: `shiptify_voice_intake_spec_UTF8...md` (provided by Aleh, 2026-05-22)

## Target
Implement MVP-1 inside this repo (`ai-orchestrator`) as a **separate module/tab** but sharing existing app context.

## Approach (incremental, hourly commits)

### Milestone 0 — scaffolding + DB
1. Add Prisma models:
   - `Intake` (customer, input kind voice/text, status enum)
   - `Transcript` (text, confidence, language, segments json)
   - `Questionnaire` (answers json)
   - `RequirementCard` (structured fields json + rendered markdown)
   - `JiraIssueLink` (intakeId, issueKey, issueId, idempotency fields)
2. `prisma db push` migration flow remains.

### Milestone 1 — API endpoints
Add Fastify routes under `/api/intake/*`:
- `POST /api/intake` create intake (text or voice placeholder)
- `POST /api/intake/:id/audio` upload audio (multipart) → store file locally (`./data/intakes/<id>/audio.*`)
- `POST /api/intake/:id/transcribe` async trigger (enqueue worker job) OR sync for MVP
- `POST /api/intake/:id/answers` submit questionnaire answers
- `POST /api/intake/:id/generate-card` generate Requirement Card via LLM
- `POST /api/intake/:id/jira` create Jira issue + attach audio/transcript/card
- `GET /api/intake/:id` details
- `GET /api/intake` list

### Milestone 2 — LLM prompts
- Language detect for input; respond in same language (default FR).
- Questionnaire generation rules:
  - Mandatory questions always
  - Conditional questions if triggers detected
- Requirement Card generation in strict JSON (validated by zod) + markdown rendering.

### Milestone 3 — Jira integration (read+write)
Create `src/jira.ts`:
- Config via env (`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`, `JIRA_ISSUE_TYPE`)
- Create issue (v3) with ADF description
- Attach files via `/rest/api/3/issue/{issueIdOrKey}/attachments` with `X-Atlassian-Token: no-check`
- Idempotency:
  - store `intakeId` in label/description + optional custom field later
  - before create: JQL search for `intakeId` marker; if found, update/comment instead of creating

### Milestone 4 — UI tab
- Add simple static page under `src/public/` (or existing UI if any) with a new tab:
  - create intake
  - upload audio
  - show transcript
  - questionnaire form
  - generate card preview
  - button: create Jira

### Milestone 5 — docker-compose readiness
- Ensure required env vars present in `.env.example`
- Add `@fastify/multipart` dependency
- Document: `docs/voice-intake_RUNBOOK.md`

## Definition of Done (from spec)
1) upload voice → transcript
2) mandatory questions saved
3) requirement card generated
4) Jira issue created + attachments
5) statuses + history present
