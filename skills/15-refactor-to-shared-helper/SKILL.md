---
name: 15-refactor-to-shared-helper
description: Refactor repeated test or service flows into shared helpers without hiding intent, assertions, or state transitions. Use when duplication is high enough to justify extraction but readability and debuggability must stay intact.
---

# Skill: refactor-to-shared-helper

## Mission
Detect repeated flows and refactor them into shared helpers or services without turning them into black boxes.

## Inputs
- set of related tests or services

## Output
- proposed helper or service API
- refactor diff or grounded change plan

## Candidate helpers
- `smartClick`
- `waitForStableUi`
- `expectToast`
- `openModal` / `closeModal`
- `selectFromAutocomplete`

## Rules
- Keep prepare → act → verify visible.
- Do not hide critical assertions in deeply nested helpers.
- Extract only when repetition is real and intention-preserving.

## References
Read these when needed:
- `references/workflows.md` — extraction workflow, thresholds, trigger boundaries
- `references/output-patterns.md` — quality bar and anti-patterns
