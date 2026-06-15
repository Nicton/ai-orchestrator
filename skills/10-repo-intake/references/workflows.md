# repo-intake workflow

## Goal
Understand the real repo before proposing tests, helpers, or architectural changes.

## Workflow
1. Confirm the target path and product area.
2. Read package manager + runtime entrypoints (`package.json`, lockfile, tsconfig, playwright config).
3. Map the test architecture:
   - fixtures
   - pages/components
   - flows/services
   - support helpers
   - existing tests by suite type
4. Extract conventions from real files, not assumptions:
   - naming
   - locator policy
   - wait strategy
   - fixture usage
   - assertion style
5. Identify architecture seams and repetition hotspots.
6. Return grounded recommendations with concrete file paths.

## Hard checks
- Never invent layers that are absent without calling that out.
- If the repo is inconsistent, report the inconsistency instead of pretending there is one clean pattern.
- Prefer examples from 2-4 real files over broad claims.

## Trigger examples
Use this skill when asked to:
- understand a repo quickly
- align new tests with existing structure
- audit current Playwright architecture

Do not use this skill as a replacement for:
- requirement decomposition
- flaky test diagnosis
- direct code generation without repo review
