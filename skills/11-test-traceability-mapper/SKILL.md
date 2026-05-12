---
name: 11-test-traceability-mapper
description: Convert requirements, stories, or task descriptions into a traceability matrix linking screens, actions, expectations, priorities, and test types. Use when coverage needs to be mapped before splitting scenarios or writing tests.
---

# Skill: test-traceability-mapper

## Mission
Convert an input requirement into a traceability matrix that downstream skills can split and implement without losing intent.

## Inputs
- task, story, bug, or requirement text
- optional supporting docs or UI flow notes

## Output (JSON)
```json
{
  "traceability_matrix": [
    {
      "screen": "...",
      "action": "...",
      "expected": "...",
      "test_type": "smoke|regression|edge|negative",
      "priority": "P1|P2|P3"
    }
  ],
  "scenario_priority": ["..."],
  "coverage_gaps": ["..."]
}
```

## Rules
- Always include negative and edge candidates when the requirement implies them.
- Mark assumptions explicitly instead of hiding them inside confident-looking rows.
- Prefer user-visible expectations over implementation detail.

## References
Read these when needed:
- `references/workflows.md` — mapping sequence, heuristics, trigger boundaries
- `references/output-patterns.md` — output quality bar and anti-patterns
