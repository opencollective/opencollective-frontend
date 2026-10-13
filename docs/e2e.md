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

Journeys that upload files need two more things the launcher cannot verify.
Build the frontend with the CI environment, because `DISABLE_MOCK_UPLOADS` is
compiled into the bundle and a plain local build replaces every upload with a
placeholder image:

```bash
TZ=UTC OC_ENV=ci NODE_ENV=test WEBSITE_URL=http://localhost:3000 API_URL=http://localhost:3060 \
  PDF_SERVICE_URL=http://localhost:3002 API_KEY=dvl-1510egmf4a23d80342403fb599qd \
  DISABLE_MOCK_UPLOADS=1 npm run build
```

The object store must also contain the `opencollective-e2e` bucket. CI creates
it in the workflow; locally run `scripts/dev/init-local-s3.ts` from the API
with the launcher's `AWS_*` values once (it only adds missing buckets). Upload
journeys fail with a message naming the mocked upload, or with the API's upload
error in `api.log`, when either is missing.

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
both independent Account journeys and the expense submission journeys (every
`*.spec.ts` under `test/playwright/specs/`, including subdirectories) through the same
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
recipes. `account-profile` and `account-conversation` both return a committed
user, an Account with an admin membership, URLs and an authentication handle.
The conversation recipe enables conversations. Neither journey needs a fiscal
host, so setup creates no host or unrelated payment graph. Journeys with
several parties or a hosted Collective use the multi-party recipes below. Frontend authors
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

### Multi-party recipes, actors and logged-out journeys

Journeys with several parties use `scenarioTest(recipe, { inputs, actor })`.
Every multi-party recipe returns the same shape, keyed by the role labels the
recipe documents: `scenario.actors`, `scenario.accounts`, `scenario.expenses`
and `scenario.urls`. `actor` names who the browser starts signed in as;
`actor: null` starts logged out while the scenario is still arranged. Override
`inputs` or `actor` for a file or a describe block with `test.use`.

```ts
import { expect, scenarioTest } from '../../fixtures';
import { submitExpense } from '../../helpers/expense-form';

const test = scenarioTest('expense-submission', { inputs: {}, actor: 'submitter' });

test.describe('paying Collective subject to VAT', () => {
  test.use({ inputs: { collective: { country: 'BE', vat: { type: 'OWN', number: 'FRXX999999999' } } } });

  test('user submits an invoice with value-added tax', async ({ page, scenario }) => {
    await page.goto(scenario.urls.submittedExpenses);
    await page.getByRole('button', { name: 'New expense' }).click();
    await submitExpense(page, { kind: 'invoice', account: scenario.accounts.collective, vat: true /* ... */ });
  });
});
```

| Recipe                 | Options (all default to off)                                                                       | Actors                                                                               | Accounts, expenses, URLs                                                                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expense-submission`   | `collective: { country, vat }`, `secondCollective`, `payeeOrganization`, `priorExpense`, `invitee` | `hostAdmin`, `submitter` (administers nothing unless `payeeOrganization`), `invitee` | `host`, `collective`, `collective2`, `organization`; expense `prior` (pending invoice by the submitter on `collective`, with a saved payout method); URLs `collective`, `newExpense`, `submittedExpenses` |
| `expense-draft-invite` | `description`, `currency`, `items` (required)                                                      | `hostAdmin`, `drafter` (Collective admin), `payeeAdmin`                              | `host`, `collective`, `payee` (Organization); expense `draft`; URL `draft` (the invitation link)                                                                                                          |

Each request owns a new active fiscal host, so no journey adds Collectives or
expenses to a seeded host. Recipes arrange starting state and prior history
only, at model level inside the receipt transaction: they send no mail and run
no mutation. Whatever a journey is about (submitting, creating a legal entity,
tax, currency) goes through the browser.

To add a recipe: in the API, register `defineRecipe({ inputs, build })` in
`server/e2e/recipes.ts` (inputs are a strict zod schema; `build` composes the
builders in `server/e2e/builders.ts` and returns references), then add its
inputs to `Contracts` and its result schema to `schemas` in
`test/playwright/fixtures/transport.ts`. Recipes that return the multi-party
shape need no other frontend change. Every actor carries a private session
token; scenario attachments drop all of them.

`test/playwright/helpers/uploads.ts` provides genuine local files for
`setInputFiles` and for drag-and-drop zones, and asserts that a preview points
at the stored file. `test/playwright/helpers/expense-form.ts` drives the
new-expense form. Each attempt attaches `fixture-timings` (wall time of every
arrangement) next to `scenario`, so reports separate setup from execution.

Recipe authors add the smallest needed domain graph under `server/e2e/`
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
upload, preserving trace resources and the original failed attempt. An incomplete
archive is retained with private permissions under
`test/playwright/.environments/.private-artifacts/<run-id>/` and excluded from
uploaded evidence; `redaction-status.json` identifies it. Other artifacts still
get scrubbed, and an existing failure/cancellation exit code is preserved. Do not
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

## Expense submission journeys (Playwright pilot)

`test/playwright/specs/expenses/` carries the submission part of the Cypress
expense pilot (`test/cypress/integration/27-expenses.test.ts`), which stays
unchanged and runnable. Nine Cypress tests map to nine journeys:

| Cypress test                                                                                                                        | Playwright journey (`specs/expenses/`)                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| new expense when logged out › shows the login screen                                                                                | `logged-out.spec.ts` › logged-out visitor is asked to sign in before submitting an expense                                                 |
| new expense when logged out › shows Submit Expense button on collective page and redirects to login                                 | `logged-out.spec.ts` › logged-out visitor reaches sign-in from the Submit Expense button of a Collective                                   |
| Invoices › Create › New user can submit invoice expense to collective hosted by e2e-host                                            | `submit-first-expense.spec.ts` › new user submits a first invoice to a Collective they do not administer                                   |
| Reimbursements › New user can submit reimbursement expense to collective hosted by e2e-host                                         | `submit-first-expense.spec.ts` › new user submits a first reimbursement to a Collective they do not administer                             |
| Invoices › Create › User can submit invoice expense to previously submitted collective                                              | `submit-returning-expense.spec.ts` › returning submitter requests invoice payment for their Organization, then invites another payee       |
| Reimbursements › User can submit reimbursement expense to previously submitted collective                                           | `submit-returning-expense.spec.ts` › returning submitter requests reimbursement payment for their Organization, then invites another payee |
| Invoices › Create › Legal entity payee › User without administered accounts can create a legal entity and submit an invoice expense | `submit-invoice-variants.spec.ts` › user without administered accounts creates a legal entity and submits an invoice through it            |
| Invoices › Create › Taxes › User can submit invoice expense with taxes                                                              | `submit-invoice-variants.spec.ts` › paying Collective subject to VAT › user submits an invoice with value-added tax                        |
| Submitting a draft keeps the requested currency › keeps the expense in USD when the selected payout method is in EUR                | `draft-currency.spec.ts` › invited Organization submits a USD draft with a EUR payout method and the expense stays in USD                  |

Every submission keeps the original form path and outcomes: paying Account and
payee selection, a new saved payout method, invoice file and reference or
per-item receipts, two items with the second in BRL converted to the USD
reference currency, two additional attachments, title and tag, every summary
figure (`$125.00`, `$550.00` for `R$500.00`, `$675.00`; `$135.00` VAT and
`$810.00` with tax), and the success confirmation. The converted amounts rely
on the fixed 1.1 exchange rate of an environment without a Fixer key. Uploads
are real local files stored through the API.

Where the journeys differ from the Cypress source, and why:

- **Own host and actors.** Cypress hangs its Collectives on the seeded
  `e2e-host` / `opensource` hosts, creates them as `testuser+admin` and invites
  the seeded user `piamancini`. Each journey owns its host, Collectives, users
  and invitee instead, so nothing is added to shared accounts.
- **"Previously submitted" flow.** The Cypress test arranges one earlier expense
  to a first Collective, then submits to a second Collective and never looks at
  the earlier one. The journey keeps exactly that flow (Organization payee,
  second payout method, then an invitation by profile) and only adds a check
  that the earlier expense is listed before starting. It does not assert that a
  previously used Account or payout method is preselected or offered: the source
  has no such check, so that would be new coverage rather than migration.
- **Invitation step.** The invited profile receives a real invitation email at
  its attempt-owned address. Reading that email and completing the invitation
  belongs to the invitation journeys, as in the Cypress source.
- **Draft.** Cypress creates the draft with `draftExpenseAndInviteUser` and
  discards the email. The recipe writes the same draft state without sending
  mail; the Organization admin then completes it in the browser. The journey
  additionally opens the submitted expense and checks it is pending in
  `$125.00 USD`, where Cypress stops at the confirmation.
- **Dropped setup.** The Cypress `beforeEach` also gives every user an
  Organization and a hosted Collective that most tests never use, and wipes the
  shared inbox. Journeys arrange an Organization only where it is the payee and
  never clear mail. The first-submission and VAT journeys therefore run as a
  user who administers nothing.
- **Waits.** The fixed 100 ms and 400 ms pauses are replaced by waiting for the
  control or value the pause was covering.

Focused reproduction:

```bash
# The whole group, fresh
./test/playwright/run-local.sh --spec test/playwright/specs/expenses --workers 3

# One journey, fresh
./test/playwright/run-local.sh --spec test/playwright/specs/expenses/submit-first-expense.spec.ts --grep "first reimbursement"
./test/playwright/run-local.sh --spec test/playwright/specs/expenses/draft-currency.spec.ts

# One journey against a retained populated stack
./test/playwright/run-local.sh --reuse --spec test/playwright/specs/expenses/submit-returning-expense.spec.ts --grep "requests invoice payment"

# First attempt fails after a real submission; the retry arranges a new host, users and prior expense
PLAYWRIGHT_ISOLATION_PROBE=1 ./test/playwright/run-local.sh --reuse \
  --spec test/playwright/specs/expenses/submit-returning-expense.spec.ts --retries 1
```

Timings, measured on an 8-CPU Linux VM with retries disabled. Setup is the
`fixture-timings` attachment (one recipe request per journey); execution is
the rest of the test's reported duration. "Alone" is one journey on a fresh
stack, where the first recipe request also warms the API (about 0.5 s);
"shared" is the median over three fresh runs of the whole selection with 4, 2
and 3 workers.

| Journey                            | Setup alone | Execution alone | Setup shared                      | Total shared |
| ---------------------------------- | ----------- | --------------- | --------------------------------- | ------------ |
| logged-out: asked to sign in       | 0.51 s      | 1.0 s           | 0.07 s                            | 1.9 s        |
| logged-out: Submit Expense button  | 0.51 s      | 1.3 s           | 0.09 s                            | 1.9 s        |
| first invoice                      | 0.46 s      | 5.6 s           | 0.06 s                            | 9.1 s        |
| first reimbursement                | 0.55 s      | 5.8 s           | 0.06 s                            | 7.1 s        |
| returning submitter, invoice       | 0.57 s      | 9.8 s           | 0.11 s                            | 13.9 s       |
| returning submitter, reimbursement | 0.52 s      | 10.2 s          | 0.10 s                            | 10.5 s       |
| legal entity                       | 0.56 s      | 10.3 s          | 0.06 s                            | 11.1 s       |
| invoice with VAT                   | 0.55 s      | 6.0 s           | 0.09 s                            | 7.0 s        |
| draft keeps USD                    | 0.51 s      | 5.3 s           | 0.87 s (first request of the run) | 10.5 s       |

Arranging a host, Collectives, users and prior history costs 0.06-0.15 s per
journey once the API is warm, under 2% of a submission journey. The nine
journeys take about 60 s of test time when each runs alone and 73 s summed
inside a shared run; the whole 14-test selection finishes in 34 s with four
workers, 38 s with three and 45 s with two, after roughly 55 s of launcher
startup on a fresh stack. The Cypress timing supplied for the pilot (04:38)
covers all 28 tests of the original file, so it is not a like-for-like
comparison for this group.

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
