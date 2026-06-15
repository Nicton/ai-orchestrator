---
name: 25-failure-classifier
description: Classify UI-step failures against the canonical taxonomy and suggest the next controlled recovery moves. Use when an interaction fails and the system needs a normalized diagnosis rather than ad-hoc guessing.
---

# Skill: failure-classifier

## Mission
Classify UI step failure using canonical taxonomy.

## Taxonomy
See: `Writerside/topics/core/tool-contracts/failure-taxonomy.topic`

## Output (JSON)
```json
{
  "class": "NO_CANDIDATE_FOUND",
  "reason": "...",
  "evidence": ["..."],
  "suggested_next": ["wait_for_overlay", "narrow_scope_to_active_modal"]
}
```
