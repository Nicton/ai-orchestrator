---
name: 27-sequence-debugger
description: Analyze a multi-step UI flow to find the first broken assumption, not just the final failing step. Use when an end-to-end sequence diverges and the plan, locator choice, or state transition must be debugged systematically.
---

# Skill: sequence-debugger

## Mission
Analyze a multi-step UI flow end-to-end and identify the first divergence.

## Output (JSON)
```json
{
  "planned_steps": ["..."],
  "first_bad_step": "...",
  "why": "plan_vs_locator_vs_state",
  "evidence": ["..."],
  "fix_recommendation": "..."
}
```

## Rules
- Do not just say “failed at step N”. Explain *which earlier assumption broke*.
