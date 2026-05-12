---
name: 24-postcondition-verifier
description: Decide whether a UI step truly succeeded by checking the most relevant state-change oracle. Use when an action has completed but success still needs explicit verification beyond element existence.
---

# Skill: postcondition-verifier

## Mission
Decide whether a step succeeded based on **state change**.

## Oracles
- URL changed / contains
- new modal/dialog opened
- toast/snackbar appears
- spinner disappeared
- list/table row created/changed
- button enabled/disabled
- DOM diff touches the expected container

## Output (JSON)
```json
{
  "ok": true,
  "matched_oracle": "url_contains('/success')",
  "details": "..."
}
```
