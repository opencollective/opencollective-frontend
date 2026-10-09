# E2E (end-to-end) tests

This is the canonical reproduction guide. Runner READMEs link here:

- Playwright (pilot, Chromium): [`test/playwright/README.md`](../test/playwright/README.md)
- Cypress (existing suite): [`test/cypress/README.md`](../test/cypress/README.md)

## Playwright fresh reproduction (Linux pilot)

One shared launcher provisions a fresh disposable Linux environment and runs a
selected Chromium journey through the real frontend, API, database, images and
PDF services. Local runs and CI use the same contract.

Prerequisites (one-time): Python 3, built frontend/API/images/PDF (`npm run build` in
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
  `opencollective_pw_e2e`; custom names must use `opencollective_pw_e2e_<suffix>`;
  protected/developer/shared/staging/production names are rejected).
- Starts services with the CI runtime contract (`TZ=UTC OC_ENV=ci NODE_ENV=test
E2E_TEST=1`) and the established E2E stubs.
- Verifies semantic readiness (database/seed/migrations, frontend-to-API
  routing, mail, object store, images/PDF) with five-minute per-service
  deadlines before browser execution.
- Runs the selected spec with Chromium, writes a replay manifest with exact
  service revisions, lockfile/build identities, seed hash, runtime/browser
  versions, selection, and non-secret config, then stops only owned processes.

Evidence per run lives under `test/playwright/.artifacts/<run-id>/`
(manifest, owned service logs, and that attempt's HTML/JSON/JUnit reports
plus traces/screenshots/videos on failure — no shared-path overwrite).
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

### Playwright CI (pilot, observational)

`CI / e2e-playwright / playwright smoke` runs the smoke, fixture contract checks,
and both independent mutable journeys through the same
shared launcher on every PR and main push, reusing the prepared
same-revision builds. It is observational: Cypress checks stay required
until pilot adoption, and the Playwright job reports real
test/setup/interruption outcomes without masking failures. Duplicate pilot
cost is not steady-state cost.

- Workers share one services stack (`PLAYWRIGHT_WORKERS`, default 1; raise
  only from measured CPU/memory/service capacity). Retries default to 0
  locally and in benchmarks; routine CI allows at most 1
  (`PLAYWRIGHT_RETRIES`; larger values are rejected) so first-attempt
  failures, recoveries, and final failures stay distinguishable.
- Every attempt uploads its run-specific `test/playwright/.artifacts/`
  directory (replay manifest, sanitized service logs, HTML/JSON/JUnit
  reports, original traces/screenshots/videos). Failure/recovery evidence
  is retained 14 days, successful evidence 7 days; expiry deletes only CI
  artifacts, never local scenario or provider records.
- Later pilot journeys reuse the same job via its `spec`/`grep` inputs; no
  new scheduling framework is needed. Live Stripe stays in Cypress.
- Fork PRs run credential-free (this workflow uses no secrets) and report
  that full live coverage is unavailable; reviewed trusted coverage on the
  same revision is required before adoption or Cypress retirement.

## Authoring independent Playwright fixtures

Use `test/playwright/fixtures` for mutable journeys. The API owns the named
`account-profile` and `account-conversation` recipes; both return a committed
user, an Account with an admin membership, URLs and an authentication handle.
The conversation recipe enables conversations. Neither journey needs a fiscal
host, so setup creates no host or unrelated payment graph. Frontend authors
need no API factories, table names or SQL.

```ts
import { expect, test } from '../fixtures';

test.use({ recipe: 'account-conversation' });

test('publishes a conversation', async ({ page, scenario }) => {
  await page.goto(scenario.urls.newConversation);
  await page.getByTestId('conversation-title-input').fill('Community news');
  await page.getByTestId('RichTextEditor').locator('trix-editor').fill('Our progress');
  await page.getByTestId('submit-new-conversation-btn').click();
  await expect(page.getByTestId('conversation-page')).toBeVisible();
  await expect(page.getByTestId('comment-body')).toHaveText('Our progress');
});
```

For a journey requiring another writable Account, arrange only that extra
prerequisite with `recipes.arrange('account-profile', { name: 'Second Account' },
'second-account')`. Repeating the same request ID and inputs within an attempt
returns exactly its committed references; changing committed inputs returns
`REQUEST_CONFLICT`. Different tests, runs, retries and replacement workers
get distinct identities and browser storage. A retry starts with a new graph,
while retrying a lost fixture response retains the original request identity.
Transport failures are retried once with that identity, including truncated
response bodies. Setup errors identify invalid requests, conflicting inputs
or rolled-back domain validation before a browser timeout can hide the cause.

The launcher supplies an ephemeral token in a private ownership file under
`test/playwright/.environments/`, outside uploaded artifacts. The API checks
that proof against the configured and actual disposable database and exposes
`POST /e2e/fixtures` only from its dedicated E2E entry point with explicit E2E
flags. Normal startup, production, staging, non-owned databases, missing or
invalid credentials are rejected. Reuse reads the owner's proof and uses a
new run identity. Rebuild the companion API branch after recipe changes; the
launcher fails readiness if the guarded route is unavailable. Both repositories
use the same branch name so the existing CI stack checkout selects the matching
API branch; merge the API companion before the frontend branch reaches main.

Recipe authors add the smallest needed domain graph in `server/e2e/recipes.ts`
in the API and extend the typed transport. Reuse model/domain validation and
small shared factory helpers under `server/`; keep legacy factory wrappers
compatible and never import `test/` into the server build. Commit the receipt
and prerequisites in one transaction. Same-identity requests serialize under
an advisory transaction lock, with bounded database waits. A disconnected
request rolls back when observed before commit; a response lost after commit
recovers the durable receipt. Validation/setup failures roll back database
writes. Side effects that cannot roll back must use scenario identities and
report identifiable retained leftovers; do not add deletion registries.

Safe reuse is deliberate. Read-only journeys can use Playwright's base `test`
and the existing public homepage or seeded Account pages without arranging a
user. A recipe may reuse a proven read-only parent or host connection if the
journey cannot mutate its permissions, balance, payment configuration or other
shared state. A host-admin or financial journey needs its own writable graph.
The current two recipes demonstrate avoiding an unnecessary host graph rather
than copying a full host per case. Keep assertions on the scenario's Account,
conversation and recipients. Namespace uploads and cache/rate keys by the owning
identity when a journey needs them. Never reset the global database, cache,
mail inbox or storage between tests, and retain scenario records after failures.

The transport uses Node fetch to keep fixture authorization out of browser
traces. Authentication is supplied through isolated browser storage, avoiding
sign-in URL tokens and shared sign-in IP counters. Scenario attachments contain
only references and attempt metadata. The launcher redacts JWTs and fixture
credentials from trace archives and textual reports/logs before handoff or
upload, preserving trace resources and the original failed attempt. Do not
attach authentication handles or raw fixture responses to evidence.

### Independence and interruption checks

Run both journeys and the fixture protocol checks on one stack:

```bash
./test/playwright/run-local.sh --spec test/playwright/specs --workers 2

# Deliberately fail after a real edit; retain populated state for inspection.
PLAYWRIGHT_ISOLATION_PROBE=1 ./test/playwright/run-local.sh --spec test/playwright/specs --workers 2 --keep-on-failure

# Reverse the initial journey order against populated state, without resets.
./test/playwright/run-local.sh --reuse --spec test/playwright/specs/account-profile.spec.ts
./test/playwright/run-local.sh --reuse --spec test/playwright/specs/account-conversation.spec.ts
./test/playwright/run-local.sh --reuse --spec test/playwright/specs --workers 2

# A failed original attempt remains visible; its replacement worker starts fresh.
PLAYWRIGHT_ISOLATION_PROBE=1 ./test/playwright/run-local.sh --reuse --spec test/playwright/specs --workers 2 --retries 1
```

The isolation probe is opt-in and deliberately reports a failed first attempt
(or a flaky recovery with one retry). Routine CI leaves it unset. Run each
mutable spec with a fresh launcher as well to verify standalone reproduction.

Focused API HTTP checks against a retained owned stack cover missing attempt
identity, domain failure after partial creation, and a client disconnect while
setup is blocked. The database lock is fault injection in the API test, followed
by a corrected same-identity retry and independent peer request. It performs no
resets or deletions. From the companion API worktree:

```bash
OC_ENV=ci NODE_CONFIG_ENV=ci NODE_ENV=test BABEL_ENV=test-fast \
  PG_HOST=localhost PG_DATABASE=opencollective_pw_e2e API_URL=http://localhost:3060 \
  PLAYWRIGHT_FIXTURE_OWNER_FILE=../opencollective-frontend/test/playwright/.environments/opencollective_pw_e2e.credentials \
  npx mocha --no-config --require ./test/setup-babel.cjs --require ./test/setup-env.cjs --exit test/e2e/fixture-http.test.ts
```

These checks refuse a database that differs from the ownership proof. They are
explicit opt-in because the ordinary API test harness owns `opencollective_test`
and must never run its reset hooks against a shared browser stack. Startup
rejection checks run normally with `npm run test -- test/server/routes/e2e-fixtures.test.ts`.

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
