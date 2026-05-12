#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${ORCH_BASE_URL:-http://127.0.0.1:4321}"

# Optional secret for /api/youtrack/webhook (not required for poll)
SECRET_FILE="${ORCH_WEBHOOK_SECRET_FILE:-/home/user/.openclaw/workspace/00_dnd_ai_orchestrator_design/secrets/youtrack_webhook_secret}"
SECRET=""
if [[ -f "$SECRET_FILE" ]]; then
  SECRET="$(tr -d '\n' < "$SECRET_FILE")"
fi

curl -sS -X POST "$BASE_URL/api/youtrack/poll" \
  -H 'content-type: application/json' \
  ${SECRET:+-H "x-youtrack-token: $SECRET"} \
  -d '{}' \
  | head -c 2000

