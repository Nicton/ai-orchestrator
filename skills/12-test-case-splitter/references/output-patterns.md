# test-case-splitter output patterns

## Expected output shape

```json
{
  "atomic_tests": [
    {
      "id": "...",
      "title": "...",
      "classification": "happy|negative|edge|permission|race",
      "preconditions": ["..."],
      "steps": ["..."],
      "expected": ["..."],
      "should_be_fixture_or_helper": ["..."]
    }
  ]
}
```

## Quality bar
- titles should make the differentiating risk obvious
- preconditions should state only what must already be true
- steps should describe actions, not hidden assertions
- expected results should be specific enough for automation or manual execution
- `should_be_fixture_or_helper` should list reusable fragments, not speculative abstractions

## Anti-patterns
- one case that mixes validation, permissions, and happy path together
- generic expectations like `works correctly`
- proposing helpers before repetition is shown
