# E2E (end-to-end) tests

This is the canonical reproduction guide. Runner READMEs link here:

- Playwright (pilot, Chromium): [`test/playwright/README.md`](../test/playwright/README.md)
- Cypress (existing suite): [`test/cypress/README.md`](../test/cypress/README.md)

## Playwright fresh reproduction (Linux pilot)

One shared launcher provisions a fresh disposable Linux environment and runs a
selected Chromium journey through the real frontend, API, database, images and
PDF services. Local runs and CI use the same contract.

Prerequisites (one-time): built frontend/API/images/PDF (`npm run build` in
each repo), `npx playwright install chromium`, and running Postgres, Mailpit,
and an S3-compatible store. The launcher starts its own disposable Redis and
validates the rest. Focused non-Stripe runs need no Stripe credentials.

```bash
cd opencollective-frontend
./test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts
```

What a fresh run does:

- Preflights tools, checkouts, builds, and infrastructure before changing state.
- Restores the selected API revision's development dump plus that revision's
  migrations into the same explicitly owned disposable database (default
  `opencollective_pw_e2e`; protected/developer/shared/staging/production names
  are rejected).
- Starts services with the CI runtime contract (`TZ=UTC OC_ENV=ci NODE_ENV=test
E2E_TEST=1`) and the established E2E stubs.
- Verifies semantic readiness (database/seed/migrations, frontend-to-API
  routing, mail, object store, images/PDF) with five-minute per-service
  deadlines before browser execution.
- Runs the selected spec with Chromium, writes a replay manifest with exact
  service revisions, lockfile/build identities, seed hash, runtime/browser
  versions, selection, and non-secret config, then stops only owned processes.

Evidence per run lives under `test/playwright/.artifacts/<run-id>/`
(manifest plus owned service logs) alongside `test/playwright/report/` and
`test/playwright/test-results/` (traces/screenshots/videos on failure).
`--keep-on-failure` retains owned processes for inspection and prints the
explicit cleanup command.

### Replay, reuse, inspection, and cleanup

Replay a recorded run from fresh matching inputs (validates service revisions,
lockfiles, seed, runtime, and browser without modifying checkouts, then runs
as fresh):

```bash
./test/playwright/run-local.sh --replay test/playwright/.artifacts/<run-id>/replay-manifest.json
```

Replay recreates recorded inputs — including a fresh database and fresh live
provider resources — not historical provider state, and it cannot guarantee
recurrence of an intermittent failure. Mismatched inputs fail with an
expected-vs-actual list instead of overwriting local changes.

Join the live owned environment for fast iteration (no database, cache, mail,
or file reset; populated state stays shared; the run registers as an active
user so the owner cannot tear the environment down underneath it):

```bash
./test/playwright/run-local.sh --reuse --spec test/playwright/specs/smoke.spec.ts
```

Retain a failed stack and clean it up explicitly (cleanup refuses while other
runs still use the environment, and only affects the retained
owned environment):

```bash
./test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts --keep-on-failure
./test/playwright/run-local.sh --cleanup
```

Agents: use the exact launcher command above with explicit `--api-dir`,
`--frontend-dir`, `--images-dir`, `--pdf-dir` when running from a worktree.
See `test/playwright/README.md` for worktree paths and artifact locations.

## Cypress (existing suite)

We use [Cypress](https://www.cypress.io/) for the existing E2E coverage, which
remains required while migration proceeds.

## Running the E2E tests in development environment

In dev environment, to execute the E2E tests, you will need to open 4 different terminals in 2 different projects.

### 1. API: Server

To make sure tests are properly reproducible, you will need to setup the Open Collective API locally.

We recommend to run a build and not the development environment.

First:

- clone and install [opencollective-api](https://github.com/opencollective/opencollective-api)

Then, simply start it for E2E with:

- `npm run start:e2e`

Behind the scenes it will do the following (so you don't have to do it):

- set environment variables: `TZ=UTC NODE_ENV=e2e E2E_TEST=1`
- reset a dedicated database (opencollective_e2e): `npm run db:restore:e2e`
- migrate the database: `npm run db:migrate`
- build the API server: `npm run build`
- start the API server: `npm run start`

### 2. Mail Server

For E2E tests we need to start the [Mailpit](https://mailpit.axllent.org/) mail server to capture test emails. On a separate terminal navigate to the `opencollective-api` project and run:

- `docker-compose -f docker-compose/mail.yml up`

### 3. Frontend: Server

If it's not already setup, look at the "Install" instructions in the [README.md](../README.md).

Make sure the Frontend is talking to the local API:

In your `.env`, paste the following content:

```
API_URL=http://localhost:3060
API_KEY=dvl-1510egmf4a23d80342403fb599qd
```

You can simply start a local server by running `npm run dev`. This is useful to quickly iterate
when developing, but if you're looking for stable and reproducible results we recommend to run a build of the Frontend. It will be faster and more reliable. To do so:

- `npm run build:e2e`

Start from the build:

- `npm run start:e2e`

When investigating a specific test, feel free to switch to the development environment:

- `TZ=UTC npm run dev`

### 4. Frontend: Cypress

You can run all the Cypress tests in CLI mode with the following command:

- `npm run test:e2e`

Cypress tests are split in 4 different groups. You can run these groups individually in CLI mode with:

- `npm run test:e2e:0`
- `npm run test:e2e:1`
- `npm run test:e2e:2`
- `npm run test:e2e:3`

To inspect tests, you can open the Cypress application with the following command:

- `npm run cypress:open`

#### Troubleshooting

- To launch with Chrome, use `npm run cypress:open -- --browser chrome` (double check Chrome is selected in the UI before running)
- On Mac OS, to force Chrome to use the English language: `defaults write com.google.Chrome AppleLanguages '(en, en-US)'`

## Testing Stripe payment elements

To run `test/cypress/integration/13-contributeFlow-stripePaymentElement.test.js`, you'll need to run some additional setup steps:

1. Login to https://dashboard.stripe.com/test/apikeys and create a new restricted key with "Debugging tools
   " permission set to "Write". Copy the key to your `STRIPE_WEBHOOK_KEY` env variable.
2. Run the local Stripe cli to redirect webhook events to your local server:

```
docker run --network host --rm -it stripe/stripe-cli:latest --api-key $STRIPE_WEBHOOK_KEY listen --forward-connect-to localhost:3060/webhooks/stripe
```

3. When the command starts, it says something like "Your webhook signing secret is whsec\_...". Copy this value to your `STRIPE_WEBHOOK_SIGNING_SECRET` env variable in the API and restart it.
4. You're good to go!
