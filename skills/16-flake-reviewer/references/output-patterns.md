# flake-reviewer output patterns

## Expected output shape

```json
{
  "root_cause_hypotheses": ["..."],
  "classified_failure": "CLICK_INTERCEPTED|ASYNC_NOT_SETTLED|LOCATOR_AMBIGUOUS|SESSION_INVALID|ASSERTION_TOO_EARLY",
  "minimal_fix": "...",
  "evidence": ["path/to/file"],
  "deferred_risks": ["..."]
}
```

## Good minimal-fix examples
- Move post-click verification into a page/flow method and wait on the resulting panel/tab state.
- Replace an unscoped text locator with a row-scoped cell locator anchored to stable business text.
- Add a named UI-settle helper around a known Angular Material transition.

## Anti-patterns
- “Increase timeout to 60s” without explaining missing postcondition
- “Use force click” without proving the click target is valid
- “Retry more” when the root cause is deterministic but hidden

## Evidence checklist
- include the failing artifact paths when they exist
- mention whether the evidence supports or weakens each hypothesis
- separate confirmed cause from plausible alternatives
