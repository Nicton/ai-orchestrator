# playwright-writer workflow

## Goal
Implement approved tests as production-ready Playwright code that respects the repo’s real architecture.

## Workflow
1. Read `repo-intake` output and open the referenced files.
2. Confirm the approved atomic tests and assumptions.
3. Choose the existing layer for each change:
   - test/spec
   - page/component
   - flow/service
   - fixture/setup
4. Implement the smallest coherent batch of code changes.
5. Keep locators and waits aligned with repo policy.
6. Add or preserve meaningful post-action verification.
7. Return code changes plus any assumptions or follow-up debt.

## Implementation heuristics
- Prefer reusing existing fixtures, services, and naming conventions.
- Move repeated business actions down a layer instead of bloating specs.
- Do not invent a new architecture just because the current one is imperfect.

## Trigger examples
Use this skill when asked to:
- write Playwright tests from approved cases
- add supporting page/service code for automation
- implement test coverage in the existing repo style

Do not use this skill as a replacement for:
- repo discovery
- assertion review only
- flake diagnosis without code-writing intent
