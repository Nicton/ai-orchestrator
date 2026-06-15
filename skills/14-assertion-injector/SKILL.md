---
name: 14-assertion-injector
description: Strengthen Playwright or UI automation code by placing meaningful post-action assertions close to state transitions. Use when a draft test or service method clicks through flows without enough verification or oracle coverage.
---

# Skill: assertion-injector

## Mission
Prevent click-and-hope automation by adding the nearest meaningful oracle after state-changing actions.

## Inputs
- draft Playwright test or service method

## Output
- updated code with stronger post-action assertions
- notes where observability is weak or ambiguous

## Preferred oracles
- route change
- modal or dialog state
- toast or snackbar appearance
- row, list, or entity mutation
- enabled or disabled transition
- loading completion when justified

## Rules
- Verify state change, not just element existence.
- Prefer domain outcomes over purely visual checks.
- Add assertions where failures stay explainable.

## References
Read these when needed:
- `references/workflows.md` — oracle-selection and placement flow
- `references/output-patterns.md` — quality bar and anti-patterns
