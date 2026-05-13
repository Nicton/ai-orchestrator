# EA Orchestrator × Visual Orchestration — Night Execution Plan

Owner: Goosebot
Mode: autonomous background execution
Repo: `tmp/ai-orchestrator` (local-only commits, no push)

## Goal Definition (Done = Full Scope)
Deliver a production-ready integration of:
1. EA Orchestrator core (system of record)
2. Visual agent activity layer (initial adapters: OpenAI GPT/Codex + Claude Code)
3. Admin mode (read/write) for managing agents, skills, pipelines
4. Runtime observability (who does what, where, with which tools/context)
5. Persistence model MD <-> Postgres serialization/deserialization
6. Export/import and Git-ready artifacts

---

## Workstream Breakdown

### WS1 — Integration Architecture (adapter bus)
- [ ] Define unified event contract for agent runtime
- [ ] Define adapter interfaces (`ClaudeAdapter`, `OpenAIAdapter`)
- [ ] Define status vs result model:
  - status: queued/running/waiting/stopped/failed/completed
  - result: success/fail/skipped/partial/no-data
- [ ] Add ownership map by modules/packages

### WS2 — Read-only Visual Layer (phase 1)
- [x] Build agent activity API (events tail) — `/api/events`
- [x] Add UI panel for agent office (Office tab)
- [x] Show activity feed + board by runs (MVP)
- [ ] Pixel Office MVP (Pixel Agents-style):
  - [ ] Add `/office/pixel` page
  - [ ] Render agents as pixel sprites in an office
  - [ ] Map `/api/events` to agent states (idle/walk/type/read/wait)
  - [ ] Click agent → open run/stage details
  - [ ] Minimal assets pack vendored under MIT
  - [ ] Autorefresh + performance budget

### WS3 — Runtime Context Visibility
- [ ] Attach optional browser/task context to agent cards
- [ ] Display model/provider and session identity
- [ ] Add trace links to execution logs/events

### WS4 — Admin Mode (read/write)
- [ ] CRUD for agents registry
- [ ] CRUD for skills registry
- [ ] CRUD for pipeline definitions
- [ ] Validate configs and hot-reload workflow graph

### WS5 — Persistence + Versionability
- [ ] Add Postgres service and schema
- [ ] Implement MD -> DB import
- [ ] Implement DB -> MD export
- [ ] Maintain deterministic file rendering for Git diffs

### WS6 — Deployment + Ops
- [ ] Compose stack update (app + worker + db + visual module)
- [ ] Route(s) on `ai.asmalouski.com` (main + visual/admin path)
- [ ] Migration and smoke tests
- [ ] Rollback checklist

### WS7 — Documentation + Handover
- [ ] Architecture doc and data model
- [ ] Runbook for nightly autonomous execution
- [ ] Open questions log
- [ ] Final status report with % complete and next actions

---

## Progress Tracking
- Overall progress: **~40%**
- Last updated: 2026-05-13 Europe/Warsaw

## Completed so far
- [x] Baseline orchestrator staged in local repo
- [x] Local commit created for baseline import
- [x] `ai.asmalouski.com` Caddy route switched to orchestrator port 4321
- [x] Initial requirements clarified: OpenAI + Claude adapters first

## Open Questions (non-blocking, decisions can be revised)
1. Preferred UI path: `/office` vs `/agents` vs `/admin/agents`
2. Should admin mode be auth-protected immediately (basic auth/JWT) or after MVP?
3. Browser context granularity: only URL/title or full interaction trace?
4. Export trigger: manual button only or scheduled snapshots too?

## Execution Rule
Continue autonomously on heartbeat pings until completion; commit local progress every meaningful block (target cadence up to ~2h).
