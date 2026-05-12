# Agent Orchestrator MVP — Usage

## Start (Docker)

```bash
cd agent-orchestrator-mvp
cp .env.example .env
# set OPENAI_API_KEY

docker compose up -d --build
```

UI: http://localhost:4321

## Stop

```bash
docker compose down
```

## Reset database (wipe all tasks)

```bash
docker compose down -v
```

## Environment variables

Configured in `.env`:

- `OPENAI_API_KEY` — **required**, token used by the worker to call the LLM
- `OPENAI_MODEL` — default: `gpt-4o-mini`
- `DATABASE_URL` — points to the docker `db` service by default
- `APP_PORT` — default: `4321`
- `WORKER_POLL_MS` — how often worker checks for new tasks (default 2000ms)
- `CALLBACK_TIMEOUT_MS` — callback POST timeout (default 10000ms)

## Health

```bash
curl http://localhost:4321/health
```
