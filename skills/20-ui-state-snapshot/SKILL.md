---
name: 20-ui-state-snapshot
description: Capture scoped before-and-after UI state, artifacts, and visible conditions to support deterministic debugging. Use when a flow needs reproducible state evidence around a browser action or failure.
---

# Skill: ui-state-snapshot

## Mission
Capture UI state **before and after** a step to make debugging deterministic.

## Inputs
- URL (optional)
- Target container scope (optional)

## Output (JSON)
```json
{
  "url": "...",
  "title": "...",
  "active_modals": ["..."],
  "visible_controls": ["..."],
  "console_errors": ["..."],
  "network_summary": "...",
  "artifacts": {
    "screenshot": "path/...png",
    "dom_snapshot": "path/...html",
    "a11y_fragment": "path/...json"
  }
}
```

## Rules
- Always include artifact paths.
- Keep snapshots scoped when possible (avoid huge DOM dumps).
