---
name: 22-action-planner
description: Turn natural-language UI intent into a deterministic step contract with postconditions and recovery hints. Use when browser actions must be formalized into structured execution plans before automation or tool invocation.
---

# Skill: action-planner

## Mission
Convert natural language intents into a deterministic UI step contract.

## Contract
Uses: `core/tool-contracts/ui-step.schema.json`

## Output
A JSON object conforming to UI Step schema.

## Rules
- Must specify postconditions (success criteria).
- Include at least 1 alternative recovery.
