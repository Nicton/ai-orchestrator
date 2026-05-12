---
name: 23-smart-click-executor
description: Execute a click as a validated UI state transition using snapshot, ranking, verification, and limited recovery. Use when a browser interaction is fragile enough that a plain click is not a sufficient contract.
---

# Skill: smart-click-executor

## Mission
Execute a click as a **validated state transition** (not just a click).

## Algorithm
1) snapshot pre-state (`ui-state-snapshot`)
2) compute candidates (`locator-ranker`)
3) validate top candidate (visible/enabled/clickable)
4) click
5) wait for UI movement signal
6) verify postcondition (`postcondition-verifier`)
7) if fail: classify (`failure-classifier`) then attempt controlled recovery (`recovery-strategy`, max 2–3)

## Output (JSON)
```json
{
  "stepId": "...",
  "success": true,
  "chosen_locator": {"strategy": "...", "value": "..."},
  "postcondition_verdict": "...",
  "artifacts": ["..."],
  "failure": null
}
```
