# Elasticsearch integration into Searchify — plan

> Goal (per TZ + your priorities): make search **faster and cheaper on tokens**. ES = search/index layer only; Postgres stays master; Claude CLI stays the external LLM; **no local LLM, no GPU**.
> Your priority order: **1) BA document + "how is this implemented in code" search → 2) Dev context for implementing tasks → 3) Testing/graph traversal → 4) GitLab graph.**

## How it will be used (maps to your words)
1. **BA / business-logic search** — ask in natural language, get the relevant requirements, docs, and the **grounded BE/FE implementation** (we already produced this for 139 requirements: each has `file:line` + commit links). ES makes this instant + ranked.
2. **Dev context pack** — for a Jira task, ES returns a compact bundle (relevant requirements + docs + code refs + tests) under a token budget, instead of dumping the repo → fewer tokens for Claude CLI.
3. **QA / graph** — traverse Requirement → Test Case → Autotest → Run → Defect and the REQ↔REQ cross-links we just built; find uncovered/related items.
4. **GitLab graph** — index branches/commits/MRs/changed-files; impact analysis MR → code → requirements → tests.

## Architecture fit (minimal, robust)
```
Postgres (Qa* tables = master)         workspaces/* code        docs/ + workspaces/documentation
        │                                    │                          │
        └──────────────── Indexer (Searchify job, Node) ────────────────┘
                                   │  normalize → chunk → (embed) → bulk index
                                   ▼
                              Elasticsearch  (search/index only, on /home volume)
                                   │  hybrid search + graph-copy + context-pack
                                   ▼
                Searchify Search API  →  /search UI · /qa · Claude CLI context packs
```
- ES runs as a docker-compose service alongside Searchify; **data dir on the /home bind-mount (1.7 TB), NOT /var (37 GB)**; heap ≤ 50% RAM and ≤ 31 GB; snapshots on.
- Searchify already owns auth → ES is never exposed directly; all queries go through Searchify API which filters by permissions (TZ §19).

## ⚠️ Embeddings decision (important given this server)
The server's outbound to external APIs is **intermittently down** (we saw api.anthropic.com + docker registry DNS fail). So semantic embeddings via an external provider would be flaky.
**MVP recommendation: start with BM25 (keyword + analyzers) over the already-structured grounded data — no embedding dependency at all.** The grounded requirements are high-signal (title, EN summary, BE/FE impl, criteria, code refs), so BM25 + good field boosting already gives strong results and is instant + free. **Add semantic vectors in Stage 2 via a small local CPU embedding model** (sentence-transformers in a tiny sidecar) — TZ explicitly allows local CPU embeddings; this avoids the flaky external dependency.

## MVP scope (Stage 1 — build first)
1. ES + Kibana docker-compose service (data on /home, heap capped).
2. Indices (aliases): `requirements-current`, `docs-current`, `knowledge-chunks-current`, `entity-links-current`.
3. **Indexer** (new Searchify module `src/elastic.ts` + a job): pull from Postgres `QaRequirement` (+ acceptance criteria, sources, the BE/FE impl already in `description`, REQ↔REQ links) and from `workspaces/documentation` + `docs/`; normalize → chunk → bulk index. Re-index on demand + incremental by `updatedAt`.
4. **Hybrid search API** in Searchify (`POST /api/search` per TZ §9.1): BM25 across requirements + chunks + links, with filters (module/section, source_system, status). Returns entity_id, globalId, title, snippet, source_url.
5. **Plug into Searchify search**: the existing global search + `/qa` search query ES first (fast), fall back to the current DB search if ES is down.
6. **Context-pack API** (`POST /api/context-pack`, token budget): grouped relevant chunks + graph links for Claude CLI → token savings on `/develop`, `/testing`, `/qa` deep-analyze.

## Index mappings (key fields, MVP)
- **requirements**: globalId, projectId, module/section, title, summary, implementation_backend, implementation_frontend, acceptance_criteria[], code_refs[] (`repo path:line + commitUrl`), priority, status, type, source_url, updated_at, (Stage2: embedding dense_vector).
- **knowledge-chunks**: chunk_id, source_entity_type/id, source_url, title, heading_path, chunk_text, module, (Stage2: embedding).
- **entity-links**: search copy of `QaEntityLink` (source/target type+id, relation_type, status) for graph expansion.
- **docs**: file path, title, headings, full_text → chunked into knowledge-chunks.

## Sequencing (after MVP)
- **Stage 2 — semantic**: local CPU embedder sidecar → dense_vector + hybrid (BM25 + kNN) → similar requirements / dedupe.
- **Stage 3 — code/dev**: index code entities (functions/routes/endpoints from `workspaces/*`); link Jira→code→requirements; dev context pack + impact analysis.
- **Stage 4 — QA graph & coverage**: index autotests + runs; traceability + coverage from ES.
- **Stage 5 — GitLab graph**: branches/commits/MRs/changed-files; MR→requirements→tests impact chain.
- Connectors for Jira / Confluence / Google Drive (the agent already has access to these via MCP for one-off pulls).

## Infra / open question (needed before standing ES up)
- ES needs RAM (recommend ≥ 4–8 GB heap for this corpus) and a data volume on /home. **What RAM is free on the server?** (the TZ says "4 CPU + large RAM"). If the box is tight, we run ES single-node with a modest heap and BM25-only first.
- Standing ES up needs Docker image pulls — currently flaky (registry DNS). We pull `elasticsearch`+`kibana` images when the registry is reachable (or pre-pull/retry like we did for the base image).

## Decisions (locked 2026-06-26)
- **RAM ≥ 8 GB free** → ES single-node, **heap 4 GB**, data dir on /home bind-mount, snapshots on.
- **Local CPU embedder from the start** (sentence-transformers sidecar, CPU) → MVP is **hybrid BM25 + kNN** (no external embedding dependency — robust to the server's flaky outbound). Pick a compact multilingual model (RU+EN) since content is bilingual.
- **Sequencing: finish requirements grounding FIRST**, then build ES. Remaining grounding (Booking / Buy & Sell / TMS-General-batch1, +rest) is blocked on the Claude usage-limit reset (≈19:40 Europe/Warsaw) — re-launch the 3 grounding agents after reset, then stand up ES and index the grounded requirements + docs.

## Token-savings payoff
Today `/develop` & deep-analyze read large code/doc context. With ES context-packs, Claude CLI receives only the top relevant chunks + graph links under a hard token budget (8k/16k/32k) → directly cheaper and faster, which is the whole point.
