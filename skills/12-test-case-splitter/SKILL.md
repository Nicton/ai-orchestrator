---
name: 12-test-case-splitter
description: Split scenarios or traceability rows into atomic, automation-ready test cases with clear scope, preconditions, and expectations. Use when broad workflows must be decomposed into isolated happy, negative, edge, permission, or race-condition tests.
---

# Skill: test-case-splitter

## Mission
Split a scenario or traceability map into atomic tests that are easy to implement, debug, and review.

## Inputs
- scenario description or traceability rows

## Output (JSON)
```json
{
  "atomic_tests": [
    {
      "id": "...",
      "title": "...",
      "classification": "happy|negative|edge|permission|race",
      "preconditions": ["..."],
      "steps": ["..."],
      "expected": ["..."],
      "should_be_fixture_or_helper": ["..."]
    }
  ]
}
```

## Rules
- Avoid branching inside one test.
- If more than 85% of steps overlap, propose extraction instead of cloning.
- Keep each case focused on one main outcome.

## References
Read these when needed:
- `references/workflows.md` — splitting flow, atomicity heuristics, trigger boundaries
- `references/output-patterns.md` — output quality bar and anti-patterns
