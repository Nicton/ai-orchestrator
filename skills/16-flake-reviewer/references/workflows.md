# flake-reviewer workflow

## Goal
Classify flaky failures using evidence first, then propose the smallest deterministic fix.

## Workflow
1. Collect evidence:
   - failing test path/name
   - trace/video/screenshot
   - error output
   - last known stable behavior if available
2. Classify the failure shape:
   - locator ambiguity
   - intercepted click
   - async not settled
   - navigation race
   - stale auth/session
   - assertion too early
3. Check whether the bug belongs in:
   - page/component
   - flow/service
   - fixture/setup
   - test assertion timing
4. Propose the minimal fix that improves determinism without hiding the problem.
5. Return evidence, classification, fix, and any remaining product debt.

## Fix preference order
1. explicit postcondition
2. better locator or scope
3. named wait helper
4. flow/service refactor
5. localized fallback with debt note

## Do not do
- recommend global timeout inflation as the first fix
- scatter `waitForTimeout` across the suite
- normalize `force: true` as a default solution
