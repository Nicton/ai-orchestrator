# Voice Intake — Next tasks (checkpoint)

This file is a **living checklist** of what’s left to reach “prod-quality” for the Voice → Requirement Intake flow.

## 1) Observability endpoints
Add explicit endpoints for debugging / transparency:
- [ ] `GET /api/intake/:id/events`
  - return ordered events (optionally with pagination)
- [ ] `GET /api/intake/:id/jobs`
  - return intake jobs ordered by createdAt (incl. status, attempts, runAfter, errorMessage)

Acceptance:
- When an intake is stuck, these endpoints show **why** (job errors, retries, last event).

## 2) Job idempotency / locking (no duplicates)
Problem: concurrent `POST /transcribe` etc can enqueue multiple jobs of the same type.

Options:
- [ ] Add a DB constraint (preferred): unique index for “active job” per `(intakeId, type)`.
  - simplest: add `jobKey` = `${intakeId}:${type}` and unique on jobKey while status in (PENDING,RUNNING) (may require partial index support; depends on DB)
- [ ] Or transactional find-or-create: within a transaction, check for existing PENDING/RUNNING job and return it; only create if none.

Acceptance:
- Under N concurrent requests, only **one** job is created; others return the same job id.

## 3) Jira integration (real)
Current behavior: stub row + status NEEDS_INFO.

Target behavior:
- [ ] Config: `config.jira.enabled` (or env) controls behavior.
- [ ] When enabled but credentials missing: fail fast with clear error + event.
- [ ] When enabled and OK:
  - create issue
  - attach transcript/card/audio as needed
  - write `JiraIssueLink` with `issueKey`, `issueId`, `issueUrl`
  - update intake status to `CREATED_IN_JIRA`
- [ ] On error: intake status `ERROR` + errorMessage + event.

Acceptance:
- Successful run produces an issue key + stable URL.

## 4) E2E smoke script
- [ ] Add script (`scripts/voice-intake-e2e.ts` or similar):
  - upload audio
  - enqueue/poll jobs until transcript/questionnaire/card exist
  - prints final intake summary
- [ ] Document usage in `docs/voice-intake_RUNBOOK.md`.

Acceptance:
- One command can validate the whole flow locally.

## 5) Optional: tighten status model
Currently used statuses include: `RECEIVED`, `TRANSCRIBED`, `QUESTIONNAIRE`, `DRAFT_READY`, `NEEDS_INFO`, `ERROR`.
- [ ] Ensure statuses cover Jira success (`CREATED_IN_JIRA`) and job failures properly.

---
Last updated: 2026-05-24
