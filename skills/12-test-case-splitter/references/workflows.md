# test-case-splitter workflow

## Goal
Turn mapped coverage into atomic tests that are isolated enough to implement, debug, and review.

## Workflow
1. Start from a scenario description or traceability rows.
2. Separate distinct intents into different test cases.
3. Split by classification when needed:
   - happy path
   - negative
   - edge
   - permission
   - race or concurrency
4. Keep each test focused on one main outcome.
5. Identify repeated setup or action fragments that might become fixtures or helpers.
6. Return implementation-ready cases with explicit preconditions, steps, and expectations.

## Atomicity heuristics
- Avoid branches like “if X then Y” inside one case.
- If a failure would make it unclear which expectation broke, split the test further.
- If more than 85% of steps overlap, propose extraction instead of cloning near-duplicates.

## Trigger examples
Use this skill when asked to:
- break a large scenario into tests
- make cases automation-ready
- isolate happy/negative/edge coverage

Do not use this skill as a replacement for:
- requirement traceability mapping
- code generation
- generic refactoring without test-scope decisions
