# How to “multiply the trained model” across projects

Meaning in this repo: you are not cloning an ML model; you are **reusing the trained/encoded knowledge** (standards, role rules, checklists, architecture) from `core/*` and swapping only **project context**.

This is the portable pattern described in `core/architecture/CORE_VS_PROJECT_CONTEXT.md`.

---

## 0) What is portable vs what is per-project

### Portable (copy/reuse as-is)
- `core/process/*` — pipeline, coding standards, universal gates
- `core/testing/*` — pillars + wave packages + QA standards
- `core/knowledge/*` — synthesized rules and lessons

### Per-project (must be replaced)
- `projects/<project>/context/*` — product-specific requirements, risks, data, selectors, environments

---

## 1) Option A (recommended): One repo, many projects

Use a single repository as your “QA operating system”, and add projects under `projects/`.

### Steps
1) Create a new project context folder:
   - `projects/<new-project>/context/`

2) Add the minimal context package (files can start small and grow):
   - `PROJECT_OVERVIEW.md`
   - `REQUIREMENTS_INDEX.md` (IDs + status)
   - `ACCEPTANCE_CRITERIA.md`
   - `RISK_PROFILE.md`
   - `NFR.md`
   - `INTEGRATIONS.md`
   - `TEST_DATA_POLICY.md`
   - `SELECTOR_POLICY.md`

3) Add (or copy) a project roadmap:
   - `projects/<new-project>/context/ROADMAP_V1.md`

4) Run a pilot:
   - pick one small feature
   - apply the same role workflow + PR/DoD gates
   - validate your first smoke checks and evidence pipeline

5) Freeze the “Core contract” for the project:
   - if the project needs special rules, prefer adding them as an addendum in `projects/<new-project>/context/` rather than modifying core

### Pros
- One “trained core” maintained once.
- Easier upgrades across all projects.

### Cons
- Projects share repo history (still isolated by folders).

---

## 2) Option B: Repo template (copy core into a new repo)

Use this when the client needs a separate repository.

### Steps
1) Create a new repo.
2) Copy `core/*` into the new repo.
3) Copy an existing `projects/<project>/context/*` folder only as a **skeleton**, then rewrite it for the new project.

> Note: for the project context lives next to the tests code at `code/e2e-tests/context/`.
4) Update README/links.

### Important rule
- Treat `core/*` as a *versioned package*. If you maintain multiple repos, consider tagging core releases (e.g., `core-v1.1`).

---

## 3) How to keep “training” improvements portable

When you learn a rule that is truly universal:
- add/update it under `core/*` (pillar, wave package, checklist)

When you learn something specific to a single product:
- add it to `projects/<project>/context/*`

A simple test:
- If it mentions product names, flows, or domain terms → context.
- If it mentions testing method, determinism, evidence, gates → core.

---

## 4) (Optional) How to port bot behavior (OpenClaw)

If by “trained model” you also mean the assistant behavior:
- keep the repo as the knowledge source,
- keep OpenClaw config the same,
- create a new `projects/<new-project>/context/` package,
- and (if needed) add a new Telegram routing/topic configuration for that project.

This keeps the assistant’s execution rules consistent while switching only context.
