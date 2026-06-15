# Architecture (MVP)

Components (Docker Compose):

- **app**: Fastify HTTP server
  - serves UI (`/`)
  - REST API (`/api/*`)
  - stores state in Postgres via Prisma

- **worker**: background loop
  - fetches oldest `PENDING` task
  - locks it by switching to `RUNNING`
  - calls OpenAI Responses API
  - stores result + token usage
  - sends optional callback POST

- **db**: Postgres

## State machine

`PENDING -> RUNNING -> DONE | FAILED`

## Data model

Single `Task` table:
- role, prompt, callbackUrl
- status, resultText, errorMessage
- token usage fields

## Notes
- One worker process (for demo). You can scale later using row-locking (or SKIP LOCKED).
- We currently lock via `updateMany` guard on `(id, status=PENDING)`.
