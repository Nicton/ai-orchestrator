# Implementation Plan

## Phase 1 in this repo

The current repo already has:

- a Fastify app;
- a static web UI;
- Prisma/PostgreSQL;
- an intake flow for voice requirement capture;
- a large local `documentation` workspace.

The fastest safe path is to extend that foundation instead of introducing a new service.

## Build order

1. Add repo-local documentation so the feature has a clear home.
2. Add backend API for the knowledge tab.
3. Index local docs from:
   - `workspaces/documentation`
   - `docs`
   - `product`
4. Add query logging and analytics tables in Prisma.
5. Add gap detection for missing or low-confidence topics.
6. Add the new Knowledge tab in `src/public/index.html`.

## Practical MVP decisions

- Retrieval for now: filesystem scan + lightweight lexical scoring.
- Answer synthesis: Claude role prompt when available, fallback summary otherwise.
- Analytics store: PostgreSQL through Prisma.
- Source of truth for content: repo-local docs first, imported systems later.

## Planned next upgrades

- pgvector-backed chunk retrieval
- explicit source ranking rules
- Confluence/Jira ingestion jobs
- graph-ready entity extraction
- voice upload entrypoint wired into the knowledge tab

## Definition of done for this pass

- new Knowledge tab is visible in the app;
- a user can ask a question and get an answer with cited source paths;
- queries are persisted;
- analytics and gaps are visible in the UI;
- documentation about the feature is discoverable in the repo.
