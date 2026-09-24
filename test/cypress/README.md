# Cypress E2E tests

End-to-end tests live in `test/cypress/integration/`. They exercise the full stack (frontend, API, images, PDF, Postgres, Redis, Mailpit, MinIO).

For local runs in the monorepo or devcontainer, use [`run-local.sh`](./run-local.sh). It builds a production-like stack (`OC_ENV=ci`), starts Redis and all services, runs Cypress, and tears down on exit. CI uses [`.github/workflows/e2e.yml`](../../.github/workflows/e2e.yml) and [`scripts/run_e2e_tests.sh`](../../scripts/run_e2e_tests.sh) instead.

## One-time setup

**Build** all services (repeat after relevant code changes):

```bash
cd opencollective-api && npm run build
cd ../opencollective-frontend && npm run build
cd ../opencollective-images && npm run build
cd ../opencollective-pdf && npm run build
```

**Install Cypress** (once per machine):

```bash
cd opencollective-frontend && npm run cypress:install
```

**Infrastructure** - Postgres, Mailpit, and MinIO must already be running (provided by the devcontainer compose, or locally on the usual ports). Install `redis-server` if missing; the script starts its own instance on port `6380`.

## Running tests

Stop other servers on ports 3000, 3060, 3001, and 3002 first (`npx pm2 stop all`).

```bash
cd opencollective-frontend

# First run (or when you need a fresh DB) - uses opencollective_e2e, not opencollective_dvl
./test/cypress/run-local.sh --setup-db --spec "test/cypress/integration/00-i18n.test.js"

# Subsequent runs
./test/cypress/run-local.sh --spec "test/cypress/integration/0*.(js|ts)"

# Interactive debugger
./test/cypress/run-local.sh --open --spec "test/cypress/integration/07-signin.test.js"
```

Service logs: `logs/cypress-e2e-*.log` at the workspace root.

### What the script handles

- Redis on port `6380` (persistence disabled; override with `REDIS_URL`)
- Host detection for Postgres, Mailpit, and MinIO (devcontainer vs localhost)
- `opencollective_e2e` database (override with `PG_DATABASE`)
- Chromium when available, otherwise Electron
- `xvfb` for headless environments

See [`run-local.sh`](./run-local.sh) or [`e2e.yml`](../../.github/workflows/e2e.yml) for the full environment.

## Faster iteration (optional)

When editing a single test, dev servers are quicker but not identical to CI. Use the `opencollective_e2e` database and `E2E_TEST=1` on the API. Outside the devcontainer, switch `PG_HOST=postgres` to `localhost` and `MAILPIT_HOST=mailpit` to `127.0.0.1`.

```bash
# Terminal 1 - API
cd opencollective-api
E2E_TEST=1 PG_DATABASE=opencollective_e2e PG_HOST=postgres MAILPIT_CLIENT=true MAILPIT_HOST=mailpit \
  AWS_S3_ENDPOINT=http://minio:9000 AWS_KEY=user AWS_SECRET=password \
  AWS_S3_BUCKET=opencollective-e2e AWS_S3_FORCE_PATH_STYLE=true AWS_S3_SSL_ENABLED=false \
  npm run dev

# Terminal 2 - frontend
cd opencollective-frontend && npm run dev

# Terminal 3 - Cypress
cd opencollective-frontend
npm run cypress:run -- --spec "test/cypress/integration/00-i18n.test.js"
```

## CI locally

To mirror GitHub Actions exactly, use `scripts/run_e2e_tests.sh` with `scripts/setup_db.sh`. That path needs Docker (Mailpit), Stripe CLI, and Chromium - it does not work in the devcontainer without Docker. Prefer `run-local.sh` there.

## Troubleshooting

| Symptom                              | Fix                                                                  |
| ------------------------------------ | -------------------------------------------------------------------- |
| Port already in use                  | Stop dev servers (`npx pm2 stop all`)                                |
| Redis is required                    | `apt-get install redis-server`                                       |
| Frontend / API is not built          | `npm run build` in the relevant repo                                 |
| Cypress failed to verify server      | Check `logs/cypress-e2e-*.log`                                       |
| Stripe specs fail                    | Need Stripe CLI + `STRIPE_WEBHOOK_KEY`; skip `40-stripe-*` otherwise |
| Mail assertions fail in devcontainer | Mailpit web UI is at `http://mailpit:8025`                           |

## Artifacts

- Screenshots: `test/cypress/screenshots/`
- Videos: `test/cypress/videos/`
- Clean up: `npm run test:clean`
