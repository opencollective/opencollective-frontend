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

Infrastructure (Postgres, Mailpit, S3-compatible store) must already be running.
The launcher starts its own disposable Redis on port `6380` and validates the
rest. Non-Stripe smoke runs need no Stripe credentials.

## Running the smoke

Stop other servers on ports 3000, 3060, 3001, 3002 first.

```bash
cd /workspace/opencollective-frontend

# Fresh disposable database (default opencollective_pw_e2e), semantic readiness, smoke
./test/playwright/run-local.sh --spec test/playwright/smoke.spec.ts

# Title filter / workers / explicit checkouts (worktrees and nested CI layouts supported)
./test/playwright/run-local.sh --spec test/playwright/smoke.spec.ts --grep "switches language" --workers 1
./test/playwright/run-local.sh --api-dir /workspace/opencollective-api --frontend-dir "$(pwd)"

# Keep owned processes on failure for inspection (prints cleanup command)
./test/playwright/run-local.sh --spec test/playwright/smoke.spec.ts --keep-on-failure
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
  revisions, lockfile hashes, seed hash, runtime/browser versions, selection,
  non-secret config, and run identity for fresh replay.
- `test/playwright/.artifacts/<run-id>/*.log` — owned API/frontend/images/PDF
  and db-restore logs (secrets sanitized).
- `test/playwright/report/` — HTML/JSON/JUnit reports.
- `test/playwright/test-results/` — traces/screenshots/videos retained on failure.

Focused non-Stripe runs require no Stripe credentials. Existing Cypress
coverage and live-integration boundaries are unchanged.
