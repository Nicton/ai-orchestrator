---
name: 16-flake-reviewer
description: Analyze flaky Playwright failures using artifacts and propose the smallest deterministic fix. Use when tests are intermittently failing and traces, screenshots, or reports need evidence-first diagnosis.
---

# Skill: flake-reviewer

## Mission

Analyze flaky tests using run artifacts (trace/video/screenshot) and propose minimal, deterministic fixes.

## Inputs

- Playwright report artifacts (`test-results/`, traces)
- Failing test + last known good run info

## Output (JSON)

{
 "root_cause_hypotheses": ["..."],
 "classified_failure": "CLICK_INTERCEPTED|ASYNC_NOT_SETTLED|...",
 "minimal_fix": "...",
 "evidence": ["path/to/screenshot.png", "path/to/trace.zip"],
 "deferred_risks": ["..."]
}

## Common causes

- overlay intercepts click
- non-unique locator (multiple matches)
- animation race
- slow API / UI not settled
- wrong frame / shadow root
- hidden modal still in DOM
- action returned before postcondition completed
- raw timeout used where explicit UI state should have been awaited

## Fix policy

- Prefer explicit postconditions over longer sleeps.
- Prefer named wait helpers over scattered raw `waitForTimeout(...)` calls.
- Keep `force: true` localized and justified.
- If a fixed wait remains necessary, document it as product-transition debt rather than pretending it is deterministic.

## References

Read these when needed:
- `references/workflows.md` — evidence-first diagnosis workflow and fix preference order
- `references/output-patterns.md` — expected output shape, evidence checklist, anti-patterns
