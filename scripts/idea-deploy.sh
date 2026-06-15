#!/bin/sh
# Independent deployer for the Ideas "implement" pipeline.
# Runs in a SEPARATE container (not the app), so rebuilding `app` cannot kill it.
# Builds + restarts app/worker, health-checks, and ROLLS BACK on failure so a
# broken idea never leaves prod down.
set -u
cd /ws || exit 1
PROJ="${COMPOSE_PROJECT:-shiptify-orchestrator}"

echo "[idea-deploy] building & restarting ($PROJ)…"
if ! docker compose -p "$PROJ" up -d --build app worker; then
  echo "[idea-deploy] BUILD FAILED — rolling back one commit"
  git reset --hard HEAD~1
  docker compose -p "$PROJ" up -d --build app worker || true
  exit 1
fi

echo "[idea-deploy] health-checking…"
i=0
while [ "$i" -lt 30 ]; do
  if wget -qO- "http://172.17.0.1:4321/" >/dev/null 2>&1 || curl -fsS "http://172.17.0.1:4321/" >/dev/null 2>&1; then
    echo "[idea-deploy] healthy ✓"
    exit 0
  fi
  i=$((i + 1)); sleep 3
done

echo "[idea-deploy] UNHEALTHY after deploy — rolling back"
git reset --hard HEAD~1
docker compose -p "$PROJ" up -d --build app worker || true
exit 1
