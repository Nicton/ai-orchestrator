---
name: 10-repo-intake
description: Rapidly understand the target repository, extract real testing architecture patterns, and identify grounded entrypoints. Use when new QA automation work must align with an existing repo instead of inventing structure from scratch.
---

# Skill: repo-intake

## Mission

Rapidly understand the target repo so every next step is **grounded in existing patterns** (no writing tests "in vacuum").

## Inputs

- Repo path (or assume current working directory)
- Optional: target area/module name

## Actions

- Read:
- `package.json` / lockfiles
- Playwright config(s)
- folder structure (`projects/*`, `core/*`, `tests/*`)
- existing helpers/pages/services/fixtures
- Extract conventions:
- naming (tests, files, tags)
- POM/service layering
- reporting/trace/video/screenshot settings
- CI hints

## Output (JSON)

{
 "architecture_summary": "...",
 "existing_patterns": ["..."],
 "anti_patterns": ["..."],
 "recommended_entrypoints": ["path/to/file", "..."],
 "assumptions": ["..."]
}

## Hard rules

- Never propose a new architecture before listing what exists.
- Prefer referencing real file paths from the repo.
- If repo patterns conflict, report the conflict instead of forcing a fake standard.

## References

Read these when needed:
- `references/workflows.md` — repo discovery sequence and trigger boundaries
- `references/output-patterns.md` — expected output shape, evidence bar, anti-patterns
