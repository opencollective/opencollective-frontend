# Playwright E2E (fresh Linux smoke)

Pilot runner for independent, reproducible E2E tests. The shared launcher owns
a fresh disposable environment; Playwright only runs browser journeys.

Canonical guide: [`docs/e2e.md`](../../docs/e2e.md). This file holds
runner-specific details.

## One-time setup

Build all services (repeat after relevant code changes):

```bash
cd /workspace/opencollective-api && npm run build
cd /workspace/opencollective-frontend && npm run build
cd /workspace/opencollective-images && npm run build
cd /workspace/opencollective-pdf && npm run build
```

Install the pinned browser once per machine:

```bash
cd /workspace/opencollective-frontend && npm run playwright:install
```

Python 3 must be available for credential redaction. Infrastructure (Postgres, Mailpit, S3-compatible store) must already be running.
The launcher starts its own disposable Redis on port `6380` and validates the
rest. Non-Stripe smoke runs need no Stripe credentials.

## Running the smoke

Stop other servers on ports 3000, 3060, 3001, 3002 first.

```bash
cd /workspace/opencollective-frontend

# Fresh disposable database (default opencollective_pw_e2e), semantic readiness, smoke
./test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts

# Title filter / workers / explicit checkouts (worktrees and nested CI layouts supported)
./test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts --grep "switches language" --workers 1
./test/playwright/run-local.sh --api-dir /workspace/opencollective-api --frontend-dir "$(pwd)"

# Keep owned processes on failure for inspection (prints cleanup command)
./test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts --keep-on-failure

# Retries: 0 by default (benchmarks); at most 1 in routine CI
./test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts --retries 1
PLAYWRIGHT_WORKERS=2 PLAYWRIGHT_RETRIES=1 ./test/playwright/run-local.sh

# Replay a recorded run from fresh matching inputs (validates, then runs fresh)
./test/playwright/run-local.sh --replay test/playwright/.artifacts/<run-id>/replay-manifest.json

# Join the live owned environment for iteration (no reset; never tears down)
./test/playwright/run-local.sh --reuse --spec test/playwright/specs/smoke.spec.ts

# Stop a retained owned environment (refuses while other runs use it)
./test/playwright/run-local.sh --cleanup
```

What the launcher does: preflights tools/checkouts/builds/infrastructure before
changing state, restores the API development dump + migrations into the same
explicitly owned disposable database (refusing protected names), starts
API/frontend/images/PDF with the CI runtime contract (`TZ=UTC OC_ENV=ci
NODE_ENV=test E2E_TEST=1`), verifies semantic readiness (API status, GraphQL
routing, frontend markup, images/PDF, mail, object store, seed tables) with
five-minute per-service deadlines, runs the selected Chromium spec, writes a
replay manifest, and stops only owned processes.

## Artifacts

Run-specific directory per execution (no shared overwrite):

- `test/playwright/.artifacts/<run-id>/replay-manifest.json` — exact service
  revisions, lockfile hashes, seed hash, runtime/browser versions, selection
  (including retries), non-secret config, and run identity for fresh replay.
- `test/playwright/.artifacts/<run-id>/*.log` — owned API/frontend/images/PDF
  and db-restore logs (secrets sanitized).
- `test/playwright/.artifacts/<run-id>/report/` — HTML/JSON/JUnit reports
  for this attempt.
- `test/playwright/.artifacts/<run-id>/test-results/` — traces/screenshots/
  videos retained on failure (original attempt kept across retries).

`test/playwright/report/` and `test/playwright/test-results/` are only the
local defaults when running `npx playwright test` directly without the
launcher (which exports run-specific overrides).

## CI (pilot, observational)

`CI / e2e-playwright / playwright smoke` reuses this launcher with prepared
same-revision builds; Cypress checks stay required. Later journeys reuse the
same job via its `spec`/`grep` inputs. Fork runs are credential-free and
report full live coverage unavailable. Failure/recovery evidence is kept
14 days, successful evidence 7 days. See `docs/e2e.md`.

Focused non-Stripe runs require no Stripe credentials. Existing Cypress
coverage and live-integration boundaries are unchanged.

## Mutable fixtures

Typed recipes and independent mutable journeys live under `fixtures/` and
`specs/account-*.spec.ts`. Run all pilot coverage with
`./test/playwright/run-local.sh --spec test/playwright/specs --workers 2`.
Fixture authoring, safe reuse, intentional failure/retry checks and API
interruption checks are documented in the canonical [guide](../../docs/e2e.md#authoring-independent-playwright-fixtures).
The companion API branch is required; ordinary Cypress startup does not enable
the fixture endpoint. Credentials stay outside uploaded evidence and are
redacted from traces and textual artifacts by the launcher.
