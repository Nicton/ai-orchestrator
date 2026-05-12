# test-traceability-mapper output patterns

## Expected output shape

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

## Quality bar
- `screen` should point to a meaningful surface, not vague scope like `app`
- `action` should describe one user intent, not a whole workflow paragraph
- `expected` should be user-observable and testable
- `coverage_gaps` should capture ambiguity, missing states, and unresolved assumptions

## Anti-patterns
- copying requirement prose without turning it into verifiable expectations
- returning only happy-path rows for a stateful feature
- hiding uncertainty inside confident-looking rows instead of listing gaps
