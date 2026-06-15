# test-traceability-mapper workflow

## Goal
Translate a task into a coverage map that later skills can split and implement without losing intent.

## Workflow
1. Read the requirement, story, bug, or task text.
2. Extract user-visible surfaces, state changes, and critical business expectations.
3. Map each expectation into traceability rows:
   - screen or area
   - user action
   - expected result
   - test type
   - priority
4. Add negative and edge coverage where the requirement implies risk or validation.
5. Surface assumptions and missing inputs as coverage gaps, not hidden guesses.
6. Return a matrix that downstream skills can split into atomic tests.

## Heuristics
- Prefer observable user outcomes over implementation detail.
- Treat permissions, validation, and state transitions as separate coverage candidates.
- Use P1 for critical business paths or data integrity risks.

## Trigger examples
Use this skill when asked to:
- build a test coverage map from requirements
- turn a story into testable scenarios
- identify gaps before writing tests

Do not use this skill as a replacement for:
- splitting tests into atomic cases
- generating Playwright code
- repo architecture discovery
