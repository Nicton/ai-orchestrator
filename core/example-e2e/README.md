# Example E2E — Canonical Exemplar

This folder is the **canonical internal exemplar** for the intended Playwright automation architecture in this repo.

It is deliberately small, but it demonstrates all target layers:

- `tests/` — readable scenarios with business assertions
- `src/services/` — fluent orchestration layer
- `src/pages/` — page objects with context-aware returns
- `src/components/` — scoped reusable UI fragments
- `src/fixtures/` — test bootstrap and typed fixtures
- `src/infrastructure/` — self-contained demo app wiring

## What this exemplar is trying to teach

1. **Fluent OOP belongs mainly in the service layer**
   - `MatterWorkbenchService` exposes the main business flow as a readable chain.
2. **Return only what changed**
   - Login returns a `DashboardPage` because the UI context changes.
   - Searching stays on the dashboard, so page/component methods return `this`.
   - Counting rows returns a `number`, because that is the real result.
3. **Waits are internalized**
   - Public methods do not force callers to sprinkle `waitForResults()` or route-settled helpers.
4. **Debugging can be more procedural temporarily**
   - The standards allow that during active diagnosis, but the canonical shape here shows the stabilized fluent form.

## Runnable status

This exemplar is **runnable and self-contained**.

It does not depend on Wikipedia or a real Datamola environment. Instead, the fixture intercepts `http://demo-app.local/*` and serves a tiny in-memory demo app with:

- login page
- dashboard with search + result table
- matter details drawer

That keeps the example stable and focused on architecture.

## Run

```bash
cd core/example-e2e
npm ci
npx playwright install chromium
npm test
```

Smoke only:

```bash
npm run test:smoke
```

Headed debug:

```bash
npm run debug
```

## Suggested reading order

1. `tests/smoke/matter-workbench.smoke.spec.ts`
2. `src/services/matter-workbench.service.ts`
3. `src/pages/*.page.ts`
4. `src/components/*.component.ts`
5. `src/fixtures/app.fixture.ts`
6. `src/infrastructure/demo-app.ts`
