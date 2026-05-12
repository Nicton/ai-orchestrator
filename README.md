# Agent Orchestrator MVP (demo)

Lightweight demo app: submit a task (role + prompt + callback URL), watch it execute, then see the result delivered to your callback.

## What you get (MVP)
- Web UI: tasks list + create task + task details
- API:
  - `POST /api/tasks` create task
  - `GET /api/tasks` list tasks
  - `GET /api/tasks/:id` task details
  - `GET /api/tasks/:id/wait` simple sync-point endpoint (long poll)
- Worker: polls DB for pending tasks, calls OpenAI, stores usage, POSTs to callback URL
- Docker Compose: app + worker + Postgres

## Docs
- `docs/USAGE.md`
- `docs/INTEGRATION.md`
- `docs/ARCHITECTURE.md`

## Quick start (Docker)
1) Create `.env`:

```bash
cp .env.example .env
# edit OPENAI_API_KEY
```

2) Run:

```bash
docker compose up --build
```

3) Open UI:
- http://localhost:4321

Postgres is exposed on `localhost:54321` (so it won’t collide with other stacks).

## Notes
- This is a **demo/admin** product: intentionally simple, built for quick iteration.
- Limits UI is a placeholder for now.
