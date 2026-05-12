---
name: 21-locator-ranker
description: Rank locator candidates by expected stability and explain the tradeoffs between test ids, accessibility locators, text, and last-resort selectors. Use when a UI action has multiple possible locator strategies and one must be chosen deliberately.
---

# Skill: locator-ranker

## Mission
Rank locator candidates by stability.

## Priority
1) `data-testid` / `data-qa` / `data-test-id`
2) aria role + accessible name
3) label/placeholder
4) text within scoped container
5) css/xpath (last resort)

## Output (JSON)
```json
{
  "chosen": { "strategy": "testid|aria|label|text|css", "value": "..." },
  "candidates": [
    { "strategy": "...", "value": "...", "score": 0.0, "reason": "..." }
  ]
}
```
