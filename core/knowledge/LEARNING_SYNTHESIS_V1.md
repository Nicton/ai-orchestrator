# Learning Synthesis V1 — Books + Official Docs

Status: Wave 1 (testing domain) synthesized and finalized as `core/knowledge/LEARNING_SYNTHESIS_WAVE1_FINAL.md`. Further waves are in progress.

Source folder (owner-provided):
- https://drive.google.com/drive/folders/1LtULfMymFlFl2-FPslQPLl3vFvKBtdZs

Additional official sources:
- TypeScript docs: https://www.typescriptlang.org/docs/
- Playwright docs: https://playwright.dev/docs/intro

---

## 1) What changes in our day-to-day decisions

### A. Tester mindset (strong QA baseline)
1. **Model-first testing** before coding (use cases, requirements, state models).
2. **Contract/state/invariant checks** over “click-only” scenarios.
3. **Risk-based coverage**: critical user flows first, then edge cases.
4. **Interaction testing** for async/events/errors/timeouts.
5. **Deterministic automation**: stable selectors, predictable data, low-flake suites.

### B. Programmer mindset (TS/JS/HTML/SQL + architecture)
1. **TypeScript strictness by default** (`strict`, explicit API contracts).
2. **Refactoring discipline**: small safe steps + tests before/after.
3. **Architecture boundaries**: policy/domain separated from framework/UI details.
4. **Readable code first**: naming, function size, cohesion, low coupling.
5. **SQL correctness + performance**: avoid antipatterns early (N+1, poor indexing assumptions).

### C. Manager mindset (delivery control)
1. **Traceability as control system**: requirement → task → test → code → release.
2. **Quality gates are non-negotiable**: DoR/DoD + critic checklist.
3. **Metrics-led steering**: lead time, escaped defects, flaky rate, rework.
4. **Risk-first planning**: test and design depth follows business impact.
5. **Standardized templates** to scale team quality without heroics.

### D. Analyst mindset (requirement quality)
1. Requirements must be **testable and unambiguous**.
2. Acceptance criteria should include **state transitions + negative paths**.
3. Non-functional constraints (performance/reliability/security) must be explicit.
4. Each requirement must map to verification artifacts.

---

## 2) Role-ready rules derived from materials

## Manager
- Require a model-first planning packet per feature:
  - use case,
  - acceptance criteria,
  - risk/use profile,
  - test scope.
- Do not start implementation until DoR is satisfied.

## Analyst
- Write requirements in verifiable form:
  - inputs,
  - expected outputs,
  - failure behavior,
  - data/state constraints.
- Add explicit anti-ambiguity examples.

## QA Architect
- Maintain 4-layer test architecture:
  1) model/requirements checks,
  2) class/contract checks,
  3) interaction/protocol checks,
  4) system smoke/regression.
- Define which checks are blocking in CI.

## Automation Engineer
- Prefer Playwright web-first assertions and resilient locator strategy.
- Keep smoke deterministic; quarantine external/flaky dependencies.
- Track flaky tests as debt with owner and due date.

## Critic
- Review not only “pass/fail”, but coverage shape:
  - invariants,
  - transitions,
  - interactions,
  - boundaries,
  - negative paths.

---

## 3) Official docs lessons to enforce now

## TypeScript (official docs)
- Use TS as default language in automation/support code.
- Emphasize:
  - everyday types,
  - narrowing,
  - object/function typing,
  - TSConfig discipline.
- Practical standard for repo:
  - strict mode on,
  - no implicit any,
  - stable shared types for test data/contracts.

## Playwright (official docs)
- Baseline setup supports:
  - multi-browser runs,
  - parallel execution,
  - HTML reports,
  - UI mode/debug traces.
- Practical standard for repo:
  - CI: stable smoke required,
  - local: headed/UI mode for debugging,
  - traces/reports attached for failures.

---

## 4) Concrete capability goals

## 4.1 Good tester
- Can derive tests from requirements/models before code.
- Can prioritize by risk and usage.
- Can design low-flake, high-signal test suites.

## 4.2 Good programmer
- Writes maintainable TS/JS code with clear contracts.
- Applies refactoring safely and continuously.
- Avoids common SQL and architecture antipatterns.

## 4.3 Good manager
- Runs delivery by measurable quality gates.
- Uses standards/templates to scale execution quality.
- Controls risk and keeps decision traceability.

## 4.4 Good analyst
- Produces testable, implementation-ready requirements.
- Eliminates ambiguity and hidden assumptions early.
- Ensures requirement-to-verification linkage.

---

## 5) Immediate rollout in Datamola QA Core
- Add this synthesis as mandatory reference for role work.
- Bind PR/MR checklist to these rules.
- Extend DoR/DoD matrix with explicit model/contract/interaction checks.
- Keep knowledge updates versioned (monthly synthesis update).

---

## 6) Ingestion log
- Download/ingestion pipeline from Google Drive folder started.
- First wave materials already available locally in `docs/books/purchased/`.
- Next iteration: per-book concise notes + role impact matrix (`BOOK_NOTES_MATRIX.md`).
