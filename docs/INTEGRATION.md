# Integration Guide (external systems)

This MVP supports a simple **async execution** pattern:

1) External system creates a task (HTTP request)
2) Orchestrator stores it as `PENDING`
3) Background worker executes the task (LLM call)
4) When finished, the worker:
   - stores `DONE`/`FAILED` result in DB
   - optionally sends a **callback** POST to your `callbackUrl`

You can integrate in two ways:

- **Push** (recommended): provide `callbackUrl` and receive result
- **Pull**: poll task status via `GET /api/tasks/:id` or use `wait` endpoint

## 1) Create task

**Request**

`POST /api/tasks`

```json
{
  "title": "Optional short title",
  "role": "Analyst",
  "prompt": "Do X, produce Y",
  "callbackUrl": "https://your-service.com/webhooks/orchestrator" 
}
```

**Response (201)**

```json
{
  "id": "ck...",
  "status": "PENDING",
  "role": "Analyst",
  "prompt": "...",
  "callbackUrl": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## 2) Callback contract (webhook)

If `callbackUrl` is provided, worker does:

`POST <callbackUrl>` with JSON:

```json
{
  "taskId": "...",
  "status": "DONE",
  "role": "Analyst",
  "model": "gpt-4o-mini",
  "result": "...",
  "usage": {
    "promptTokens": 123,
    "completionTokens": 456,
    "totalTokens": 579
  },
  "startedAt": "2026-04-20T...Z",
  "finishedAt": "2026-04-20T...Z"
}
```

### Callback reliability (MVP)
- Best-effort: if callback fails, the task stays DONE/FAILED anyway.
- No retries/backoff yet (can be added next).

## 3) Pull-based sync point

### Poll

- `GET /api/tasks/:id` returns current task state.

### Wait endpoint (simple sync point)

`GET /api/tasks/:id/wait?timeoutMs=30000&pollMs=500`

- Returns the task immediately if it is `DONE` or `FAILED`
- Returns **202** if still running after timeout

This is useful when an external service can do a “wait-until-complete” step.

## 4) Example (curl)

```bash
TASK_ID=$(curl -s http://localhost:4321/api/tasks \
  -H 'content-type: application/json' \
  -d '{"role":"Analyst","prompt":"Summarize this in 5 bullets"}' \
  | jq -r .id)

curl -s "http://localhost:4321/api/tasks/$TASK_ID/wait?timeoutMs=60000" | jq
```
