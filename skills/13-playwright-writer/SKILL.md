---
name: 13-playwright-writer
description: Generate production-ready Playwright tests and supporting code that fit the existing repository architecture and locator policy. Use when approved atomic tests are ready to be implemented as maintainable code changes.
---

# Skill: playwright-writer

## Mission
Generate production-ready Playwright code using the existing repo architecture rather than inventing a new one.

## Inputs
- approved test cases from `test-case-splitter`
- repo conventions from `repo-intake`

## Output
- code changes across tests and supporting layers
- explicit assumptions list when behavior or architecture is ambiguous

## Rules
- Respect repo locator policy and layering rules.
- Do not place selectors directly in specs if project rules forbid it.
- Keep meaningful post-action verification close to state transitions.
- Prefer stable locators: data-testid → aria role/name → label.

## References
Read these when needed:
- `references/workflows.md` — implementation sequence and repo-fit heuristics
- `references/output-patterns.md` — quality bar and anti-patterns for generated code
