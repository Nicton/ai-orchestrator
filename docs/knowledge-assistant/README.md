# Knowledge Assistant Workspace

This folder is the local landing zone for the Shiptify knowledge assistant work.

## What lives here

- [SPEC.md](./SPEC.md): assembled contractor-ready version of the business idea and phased scope.
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md): practical build plan for the current codebase.
- [REPO_MAP.md](./REPO_MAP.md): where the important code, documents, and data sources live.

## Current implementation stance

Phase 1 is intentionally framed as:

`RAG assistant + query analytics`

That means:

- new UI tab in the existing app;
- retrieval across `workspaces/documentation`, `docs`, and `product`;
- query logging and analytics in PostgreSQL;
- gap detection for missing documentation topics;
- no hard dependency on knowledge graph for MVP.

Graph reasoning, realtime voice dialog, Jira task creation, and autonomous BA/QA flows remain later-phase extensions.
