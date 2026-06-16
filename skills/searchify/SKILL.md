---
name: searchify
description: Operate and extend the Searchify "second brain" — the Shiptify product knowledge assistant (LLM + knowledge graph), the Quality Coverage Analytics platform, and the Improvement-Ideas auto-implement module, all served from the ai-orchestrator app. Use when working on Searchify features, the knowledge graph, quality scoring, the ideas pipeline, or deploying Searchify to prod (searchify.asmalouski.com).
---

# Searchify Skill

Searchify is the Shiptify **"second brain"**: a knowledge assistant that answers questions about the
product/processes/docs from a real **knowledge graph**, plus two analytics/ops modules built on the same
data. It lives inside **ai-orchestrator** (Fastify + Prisma/Postgres, plain HTML frontend in `src/public/`)
and is deployed at **https://searchify.asmalouski.com** (also shiptify/ai/datamola domains).

When asked to change Searchify, follow the file map, run the checks, and ALWAYS redeploy prod at the end.

## Modules (one app, several views)

| Module | Route | Backend | Frontend |
|---|---|---|---|
| Knowledge Assistant (ask + history + corrections + gaps) | `/` | `src/knowledge.ts` | `src/public/index.html` |
| Knowledge Graph (force-directed, drill to feature/modal) | `/graph` | `/api/knowledge/graph` in `src/knowledge.ts`, loader `src/graphLoader.ts` | `src/public/graph.html` |
| Quality Coverage Analytics (Treemap / Matrix / Graph) | `/quality` | `src/quality.ts` | `src/public/quality.html` |
| Improvement Ideas (+ autonomous "Реализовать") | `/ideas` | `src/ideas.ts` | `src/public/ideas.html` |
| Auth (cookie session, admin) | — | `src/auth.ts` | login in `index.html` |
| LLM engine | — | `src/llm.ts` (`runRolePrompt`) | — |
| Config | — | `src/config.ts` | — |

Registration: `src/app.ts` wires `registerKnowledgeApi` / `registerIdeasApi` / `registerQualityApi` and the
page routes (`/graph`, `/ideas`, `/quality`). Header nav lives in `index.html` topbar
(`graphBtn` / `qualityBtn` / `ideasBtn` / `histBtn` / `adminBtn`).

## Data Lake (the graph) — single source of truth

The graph is built from the canonical product docs, loaded into Postgres, and read by every module.

1. **Build**: `node workspaces/documentation/product/tools/build-graph.cjs` →
   `workspaces/documentation/product/tools/graph.json`.
   Nodes: `doc | module | area | code_file | requirement | feature | screen | modal | confluence`.
   Edges: `belongs_to, relates_to, part_of, documents, references, published_as, covered_by,
   has_feature/feature, has_screen/screen, has_modal/modal, mentions, opens (screen→modal),
   verified_on (req→screen), child_of (confluence tree)`. ~1200 nodes / ~5700 edges.
   Requirement nodes carry `desc` (RTM text) + `confluence` (RTM page) for deep-linking.
2. **Load**: `src/graphLoader.ts` (`loadGraphIntoDb`) reads `graph.json` → `KnowledgeEntity` /
   `KnowledgeRelation`, idempotent via a sha1 `_meta` marker. Runs on app startup (`src/app.ts`).
   `GRAPH_PATH = cwd()/workspaces/documentation/product/tools/graph.json`.
3. **Read**: knowledge graph-aware answers, `/graph` viz, and the Quality engine all query the DB.

### Extra data sources (committed JSON, COPY'd into the image)
- `docs/qa/autotests-index.json` ← `scripts/index-autotests.mjs` (indexes TestCafe repo
  `workspaces/main-app-automation/src/tests`, ~806 tests) → **Automation** layer.
- `docs/qa/defects-index.json` ← `scripts/index-defects.mjs` (Jira open-defects export, ~250) →
  **Defects** layer / Bugs.
- `docs/qa/test-cases-MA-2026-05-25.json` (Qase export, 3101 cases) → **Tests** layer.
Re-run the indexer scripts after updating their sources, then commit the regenerated JSON.

## Knowledge Assistant answer pipeline (`src/knowledge.ts`)

`/api/knowledge/ask` → `searchKnowledge` (lexical hits) → `composeAnswer`:
1. `graphContext(question)` — fuzzy-matches modules/areas/features (Levenshtein, transliteration
   `тмс→tms`, `док→dock`) and pulls the structural answer from the graph.
2. **LLM** via `runRolePrompt` (**Claude CLI only** — ChatGPT/OpenAI is NOT in the answer scheme).
   LLM answer is primary; the graph structure is appended **after** it (`---`). If Claude CLI is
   unavailable, the answer is an explicit notice (`copy.llmUnavailable`, "Адаптированный ответ
   временно недоступен… обратитесь к Алеху Асмалоускому") + the graph structure below it as raw data.
   Every query stores an **`llmLog`** (engine, model, outcome, raw) shown in `/` and History.
3. Confidence from hits; graph-backed answers are not under-rated.

**LLM engine (`src/llm.ts` `runRolePrompt`)**: **only** `claude` CLI (model `config.answerModel`),
else returns empty with a diagnostic log. Never throws. ChatGPT/OpenAI was removed from the answer
scheme per product decision (OpenAI is still used ONLY for Whisper voice STT in `transcribeAudioFile`).
- Claude CLI auth in the container: env **`CLAUDE_CODE_OAUTH_TOKEN`** (from `claude setup-token`) —
  do NOT bind-mount the host `~/.claude` (concurrent refresh wiped it before). If Claude has no auth,
  answers show the "temporarily unavailable / contact Aleh Asmalouski" notice — the `llmLog` shows why.

## Quality Coverage Engine (`src/quality.ts`)

Coverage Score weights (TZ): **SubReq 20 · Docs 15 · Tests 25 · Auto 20 · Run 10 · Defects 10**.
- Dynamic depth: 100% renormalizes over **enabled** layers (`?layers=` / chips). Disabled layers excluded.
- **Run (execution)** layer is hidden in the UI (no data source).
- SubReq/Docs from the graph (doc status). Tests from Qase cases (req text-match). Automation from repo
  autotests (token match). **Defects**: req↔Jira-defect text match (≥3 tokens, same domain); module
  Defects% = bug **density** vs requirement count (lenient, `DEFECT_DENOM`), Bugs column = matched count.
- Heatmap buckets: 0-20 dark-red · 20-40 red · 40-60 orange · 60-80 yellow · 80-95 light-green · 95-100 green.
- Views: Treemap (drill System→Module→Area), Traceability Matrix, Dependency Graph (reuses `/graph`),
  Snapshots (save/list/compare). `QualitySnapshot` Prisma model.

## Ideas module (`src/ideas.ts`) — autonomous implement

Users submit ideas + see statuses (PENDING/APPROVED/REJECTED/IN_PROGRESS/APPLIED/FAILED). Admin can
**⚙ Реализовать**: runs the Claude CLI agent **as non-root (uid 1000)** on the mounted deploy repo
(`/workspace`), `git add` excluding `workspaces/data/secrets`, commit, push, then a **separate deployer
container** runs `scripts/idea-deploy.sh` (build → health-check on `172.17.0.1:4321` → **rollback** on
failure). ⚠️ Admin-only, web-triggered prod deploy — treat as a prod-deploy button.

## Prod runbook (server `user@192.168.0.28`, password in local `.env`; use Posh-SSH)

Deploy project: `/home/user/ka-prod-deploy` (git clone of this repo), Docker compose project
**`shiptify-orchestrator`** (`app`, `worker`, `db`). Caddy (host, single-file bind-mount Caddyfile —
**never `sed -i` it**, `docker restart caddy` to reload) → Cloudflare token-tunnel → app `:4321`.

Standard deploy (run FROM the host, never from inside the app container — see Ideas self-kill bug):
```
cd /home/user/ka-prod-deploy && git pull --no-edit \
  && docker compose -p shiptify-orchestrator build app \
  && docker compose -p shiptify-orchestrator up -d app worker
```
- If you changed `graph.json`, SFTP it to `/home/user/ka-prod-deploy/workspaces/documentation/product/tools/`
  before building (the build context COPYs `workspaces/`).
- `db:push` runs on app start (creates new Prisma columns/tables — no manual migration).
- Verify: `curl -s -o /dev/null -w "%{http_code}" https://searchify.asmalouski.com/` → 200, and
  `docker logs shiptify-orchestrator-app-1 | grep "graph loaded"`.
- Admin creds for end-to-end API tests: `ADMIN_EMAIL` / `ADMIN_PASSWORD` env in the app container.

## Local checks before deploy
```
npx prisma generate            # after schema.prisma changes
npx tsc -p tsconfig.json --noEmit   # ignore pre-existing implicit-any warnings
node workspaces/documentation/product/tools/build-graph.cjs   # if graph data changed
node scripts/index-autotests.mjs ; node scripts/index-defects.mjs   # if QA sources changed
```

## How to run this skill
Invoke it in Claude Code with **`/searchify`** (or the Skill tool, name `searchify`), optionally with a
task, e.g. `/searchify add a CO2 column to the Quality matrix`. The skill loads this runbook so the
agent edits the right files, runs the checks above, and finishes by **redeploying prod** and verifying
`https://searchify.asmalouski.com/`. For routine asks (answer quality, graph, quality scoring, ideas)
just describe the change — this file is the map.
