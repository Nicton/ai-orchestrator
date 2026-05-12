# refactor-to-shared-helper workflow

## Goal
Extract repetition into shared helpers without turning tests into unreadable black boxes.

## Workflow
1. Inspect the repeated tests or service methods.
2. Confirm the repetition is structural, not accidental similarity.
3. Identify the right extraction layer:
   - fixture
   - helper
   - page/component method
   - flow/service method
4. Design a helper that keeps prepare → act → verify visible.
5. Refactor the smallest useful batch.
6. Return the helper API and refactor diff.

## Extraction heuristics
- Extract when repeated steps are stable and intention-preserving.
- Keep business assertions visible unless they are universally coupled to the action.
- Prefer domain-named helpers over vague utility wrappers.

## Trigger examples
Use this skill when asked to:
- remove duplicated UI flow code
- consolidate repeated test setup or actions
- create shared helpers without hiding behavior

Do not use this skill as a replacement for:
- broad architecture redesign
- premature abstraction after one or two examples
- generic formatting or style cleanup
