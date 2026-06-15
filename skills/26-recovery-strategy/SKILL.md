---
name: 26-recovery-strategy
description: Apply limited, predictable recovery actions after a classified UI failure without masking deeper issues. Use when a browser step has failed and bounded retries or scoped remediation are appropriate.
---

# Skill: recovery-strategy

## Mission
Perform limited, predictable recovery actions after a classified failure.

## Allowed recoveries
- narrow scope to active modal/dialog
- wait for overlay/spinner to disappear
- scrollIntoViewIfNeeded
- recompute locator
- wait until enabled
- verify iframe/shadow-root
- try next semantic candidate

## Rules
- Max 2–3 attempts.
- If not recovered: stop and report with artifacts.
