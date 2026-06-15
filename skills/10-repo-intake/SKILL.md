---
name: 10-repo-intake
description: Rapidly understand a repository — for QA automation grounding OR for product documentation research. Extracts architecture, patterns, tech stack, and key entities. Use before writing tests OR documentation.
---

# Skill: repo-intake

## Mission

Rapidly understand the target repo so every next step is **grounded in existing patterns**. Works in two modes:
- **QA mode**: extract test architecture, patterns, entrypoints
- **Documentation mode**: extract product features, API routes, models, pages

## Inputs

- Repo path (or assume current working directory)
- Optional: target area/module name
- Optional: mode = `qa` (default) | `docs`

## Actions — QA Mode

- Read `package.json`, Playwright config, folder structure
- Extract: test naming, POM/service layers, CI hints, reporting settings
- Identify existing helpers, pages, services, fixtures

## Actions — Documentation Mode

- Read `README.md`, `package.json` for tech stack
- Explore `src/`, `app/`, `client/` for pages/routes/components
- Read route files to understand API surface
- Read model files to understand data entities
- Read controller/service files for business logic
- Check `public/app/` or `frontend/` for UI pages

## Output (JSON)

```json
{
  "mode": "qa|docs",
  "tech_stack": ["React 19", "Express", "PostgreSQL"],
  "architecture_summary": "...",
  "key_sections": ["SalesAccounts", "BillingAccounts", "..."],
  "api_routes": ["GET /accounts", "POST /users", "..."],
  "models": ["Account", "User", "..."],
  "existing_patterns": ["..."],
  "anti_patterns": ["..."],
  "recommended_entrypoints": ["path/to/file"],
  "assumptions": ["..."]
}
```

## Shiptify-specific context (learned)

Shiptify has these repos at: `c:/Users/Lenovo/Desktop/12devs/shiptify/code/ai-orchestrator/workspaces/`

| Repo | Stack | Purpose |
|------|-------|---------|
| `backend` | Node.js/Express + Sequelize | Main TMS API (466+ models) |
| `frontend` | AngularJS 1.8 | Main TMS UI |
| `frontend-mono` | React 19 | New TMS frontend |
| `mini-apps` | React 19 + Apollo GraphQL | 7 sub-apps (driver, carrier, slotify...) |
| `back-office` | React 16 + TypeScript | Internal BO for sales/AM team |
| `admin-app` | AngularJS 1.5 | Admin panel (full access) |
| `testing-tools` | Jest + jest-cucumber | BDD integration tests |
| `chat` | EMPTY | Planned chat microservice |
| `identity` | EMPTY | Planned auth/SSO service |

## Hard rules

- Never propose a new architecture before listing what exists.
- Prefer referencing real file paths from the repo.
- If repo patterns conflict, report the conflict instead of forcing a fake standard.
- For documentation mode: distinguish between "active production code" vs "empty/planned"

## References

Read when needed:
- `references/workflows.md` — repo discovery sequence
- `references/output-patterns.md` — expected output shape
