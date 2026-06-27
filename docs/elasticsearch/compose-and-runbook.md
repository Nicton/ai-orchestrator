# Stand-up runbook — Elasticsearch (when the image is cached)

## 1. docker-compose service (add to ~/ka-prod-deploy/docker-compose.yml under `services:`)
```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.15.3
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false        # internal only, behind Searchify API
      - ES_JAVA_OPTS=-Xms4g -Xmx4g          # 4 GB heap (server has 31 GB / ~20 free)
      - bootstrap.memory_lock=true
    ulimits:
      memlock: { soft: -1, hard: -1 }
    volumes:
      - /home/user/ka-prod-deploy/es-data:/usr/share/elasticsearch/data   # data on /home (1.5 TB), NOT /var
    restart: unless-stopped
    # NO published ports — app reaches it on the compose network at http://elasticsearch:9200
```
The `app` service already defaults `ES_URL=http://elasticsearch:9200` (no env change needed); same compose project → same network.

## 2. Bring up
```bash
mkdir -p /home/user/ka-prod-deploy/es-data && chmod 777 /home/user/ka-prod-deploy/es-data
cd ~/ka-prod-deploy && docker compose -p shiptify-orchestrator up -d --no-deps elasticsearch
# wait for green-ish:
curl -s localhost:9200/_cluster/health
```

## 3. Deploy app code (hot, until next clean rebuild)
```bash
docker cp src/elasticsearch.ts shiptify-orchestrator-app-1:/app/src/elasticsearch.ts
docker cp src/app.ts          shiptify-orchestrator-app-1:/app/src/app.ts
docker restart shiptify-orchestrator-app-1
```

## 4. Create indices + index the grounded requirements + docs
```bash
T=$(grep ^QA_API_TOKEN= ~/ka-prod-deploy/.env|cut -d= -f2)
# (search endpoints use Searchify session auth; from inside the container use the app itself,
#  or call with a logged-in session. For a quick server-side trigger, hit the reindex endpoint
#  via an authenticated request, or run indexRequirements() through a one-off node script.)
curl -s -XPOST localhost:4321/api/search/reindex -H 'content-type: application/json' \
  -d '{"docsDir":"/app/workspaces/documentation"}'   # add auth as needed
curl -s -XPOST localhost:4321/api/search -H 'content-type: application/json' \
  -d '{"query":"pagination default page size"}'
```

## 5. (Stage 2) local CPU embedder sidecar → semantic/hybrid
Add a tiny service exposing `POST /embed {texts:[]} -> {vectors:[[...]]}` (sentence-transformers, multilingual RU+EN, CPU), set on `app`:
```yaml
    environment:
      - EMBED_URL=http://embedder:8088/embed
      - EMBED_DIM=384
```
Re-create indices (they gain a `dense_vector`) and reindex; `search()` then blends BM25 + kNN.

## Notes
- BM25-only works with NO embedder (current default) — robust to the server's flaky outbound.
- `prune -af` is BANNED here (it nuked the app base image before). Pull ES image with retries; don't prune.
- ES image pull is currently blocked by intermittent outbound to docker.elastic.co — retry loop running (`/tmp/es_pull.log`).
