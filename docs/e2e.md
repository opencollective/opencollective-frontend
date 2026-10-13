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
recipe documents: `scenario.actors`, `scenario.accounts`, `scenario.expenses`,
`scenario.vendors` (empty unless the recipe arranges vendors) and
`scenario.urls`. `actor` names who the browser starts signed in as;
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

| Recipe                 | Options (all default to off)                                                                                                                                                        | Actors                                                                                                  | Accounts, expenses, URLs                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expense-submission`   | `collective: { country, vat }`, `secondCollective`, `payeeOrganization`, `priorExpense`, `invitee`, `inviteeOrganization`                                                           | `hostAdmin`, `submitter` (administers nothing unless `payeeOrganization`), `invitee`, `inviteeAdmin`    | `host`, `collective`, `collective2`, `organization`, `inviteeOrganization` (administered by `inviteeAdmin` only); expense `prior` (pending invoice by the submitter on `collective`, with a saved payout method); URLs `collective`, `newExpense`, `submittedExpenses`                                                                              |
| `expense-draft-invite` | `description`, `currency`, `items` (required)                                                                                                                                       | `hostAdmin`, `drafter` (Collective admin), `payeeAdmin`                                                 | `host`, `collective`, `payee` (Organization); expense `draft`; URL `draft` (the invitation link)                                                                                                                                                                                                                                                    |
| `expense-management`   | `expense: { description, items }`, `project`                                                                                                                                        | `hostAdmin`, `admin` (Collective admin; submitter and payee of the expense)                             | `host`, `collective` (no expense policy), `project` (under `collective`, same host); expense `pending` (invoice by `admin` on `collective`, with a saved payout method); URLs `expenses`, `policies`, `projectNewExpense`                                                                                                                           |
| `vendor-host`          | `useVendorPolicy`, `grants`, `secondCollective`, `project`, `outsider`, `otherHost: { admin, collective }`, `vendors: [{ label, host, usableWith, useVendorPolicy, payoutMethod }]` | `hostAdmin`, `collectiveAdmin`, `outsider` (no role anywhere), `otherHostAdmin`, `otherCollectiveAdmin` | `host` (no vendor policy unless `useVendorPolicy`), `collective` (admin `collectiveAdmin`), `collective2` (admin `hostAdmin`), `project` (under `collective`), `otherHost` (unrelated host, administered by `hostAdmin` or `otherHostAdmin`), `otherCollective` (on `otherHost`); vendors by `label` in `scenario.vendors`; URL `hostedCollectives` |

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

A journey with a second party opens another browser with
`openBrowserAs('<actor label>')`, or `openBrowserAs(null)` for a logged-out
visitor. It returns a page in a separate context that shares no storage with
`page` and closes with the attempt; traces and failure evidence cover it too.

### Mail

Journeys read real SMTP deliveries from the shared Mailpit inbox through the
`mail` fixture (`test/playwright/helpers/mail.ts`). The inbox is never cleared
and keeps mail from other attempts, retries and earlier runs, so a lookup is
tied to the attempt in three ways:

- **Recipient.** Look up an address the attempt owns: a recipe actor's `email`
  (recipes derive it from the attempt identity, so a retry gets new addresses)
  or `mail.address('<label>')` for someone who has no account yet. The helper
  matches the exact delivered address; outside production the API rewrites
  `a@b.com` to `emailbcc+a-at-b.com@opencollective.com`.
- **Time.** Only messages delivered after the attempt started count.
- **Uniqueness.** `mail.waitForMessage({ to, subject })` polls until one such
  message exists and fails if several match, so a subject must be specific
  enough (product subjects usually name an Account of the scenario). Never
  match a shared recipient such as `testuser+admin@opencollective.com`.

```ts
const test = scenarioTest('expense-submission', { inputs: { inviteeOrganization: true }, actor: 'submitter' });

test('invited Organization follows its emailed invitation', async ({ page, scenario, mail, openBrowserAs }) => {
  // ... the submitter invites scenario.accounts.inviteeOrganization through the form
  const link = await expenseInvitationLink(mail, {
    to: scenario.actors.inviteeAdmin.email,
    account: scenario.accounts.collective,
  });
  const invited = await openBrowserAs('inviteeAdmin');
  await invited.goto(link);
});
```

Add a helper next to `expenseInvitationLink` for each new kind of message
rather than reading Mailpit from a spec. Each attempt that waited for mail
attaches `mail-timings` (recipient, subject, wait in ms). The launcher exports
`MAILPIT_URL` in fresh and `--reuse` runs; the helper refuses to guess it.
Recipes still send no mail: the message a journey asserts on is always caused
by the journey.

`test/playwright/helpers/uploads.ts` provides genuine local files for
`setInputFiles` and for drag-and-drop zones, and asserts that a preview points
at the stored file. `test/playwright/helpers/downloads.ts` has
`downloadPdf(trigger, testInfo)`: it clicks the control, saves the browser
download under the attempt's own output directory (`testInfo.outputPath`, a
different directory for every test, retry and run, kept with the run's
artifacts) and returns the suggested file name and the document text, so
journeys assert on what the real local PDF service rendered. `test/playwright/helpers/expense-form.ts` drives the
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
  belongs to the [invitation journeys](#expense-invitation-journeys-playwright-pilot),
  as in the Cypress source.
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

## Expense invitation journeys (Playwright pilot)

`test/playwright/specs/expenses/invite-*.spec.ts` carries the invitation part
of the Cypress expense pilot (`test/cypress/integration/27-expenses.test.ts`,
`Invite` blocks), which stays unchanged and runnable. Six Cypress tests map to
six journeys:

| Cypress test                                                                                                         | Playwright journey (`specs/expenses/`)                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invoices › Create › Invite › User can submit invoice expense invite to existing organization                         | `invite-organization.spec.ts` › invited Organization follows its emailed invoice invitation and submits the expense                                  |
| Reimbursements › Invite › User can submit reimbursement expense invite to existing organization                      | `invite-organization.spec.ts` › invited Organization follows its emailed reimbursement invitation and submits the expense                            |
| Invoices › Create › Invite › User can submit invoice expense invite to existing organization initially logged out    | `invite-organization-logged-out.spec.ts` › logged-out visitor opening an Organization's emailed invoice invitation is sent to sign in and back       |
| Reimbursements › Invite › User can submit reimbursement expense invite to existing organization initially logged out | `invite-organization-logged-out.spec.ts` › logged-out visitor opening an Organization's emailed reimbursement invitation is sent to sign in and back |
| Invoices › Create › Invite › User can submit invoice expense invite to new user                                      | `invite-new-user.spec.ts` › person without an account follows their emailed invoice invitation and submits the expense without signing in            |
| Reimbursements › Invite › User can submit reimbursement expense invite to new user                                   | `invite-new-user.spec.ts` › person without an account follows their emailed reimbursement invitation and submits the expense without signing in      |

Every journey keeps the inviter's side as it was: a user who administers
nothing opens "New expense", fills the whole form (items, BRL conversion,
receipts, attachments, title, tag, summary figures) with "Invite someone" as
the payee, and submits. The invitation then travels through the API's normal
mailer over local SMTP to Mailpit; the journey finds it through the `mail`
fixture and opens its "OK, let's go!" link in a second browser. The recipient
sees the invitation with its decline option and continues:

- **Existing Organization.** Its admin, signed in, adds and saves a payout
  method, picks the type (attaching an invoice file and reference for an
  invoice) and submits.
- **Logged out.** Without a session the invitation is still readable; the
  sign-in link offered in the payee section leads to `/signin?next=<invitation>`.
- **New user.** The form shows the name and email the inviter entered and
  offers to sign in; the person adds an unsaved payout method, picks the type
  (asking for a generated invoice) and submits without signing in.

Where the journeys differ from the Cypress source, and why:

- **Mail ownership.** Cypress deletes the whole inbox before every test and
  takes the first message tagged with the recipient whose subject contains
  "wants to pay you" or "to send funds to". The journeys never clear the inbox
  and accept only the single message delivered after the attempt started to an
  address that exists for this attempt alone, with a subject naming the
  attempt's Collective, whose link points at an expense of that Collective.
- **Own graph.** The Collective hangs on an attempt-owned host instead of the
  seeded `e2e-host`; the invited Organization and its admin come from the
  `inviteeOrganization` recipe option; the new user's address comes from
  `mail.address()`. Sending and accepting the invitation are never arranged.
- **Second browser instead of logout.** Cypress logs the inviter out and
  reuses the browser. The recipient gets a separate context
  (`openBrowserAs`), so the inviter's session is still there to check the outcome.
- **Outcome check added.** Cypress stops at "has been submitted
  successfully!". The two completing journeys also reopen the expense as the
  inviter and check that it is pending with the invited payee.
- **Logged-out variant stops at sign-in, as in the source.** The ticket asks
  for sign-in and a completed submission in every variant; the Cypress test
  ends at the redirect to `/signin?next=...`, so signing in and submitting from
  there would be new coverage and is not claimed. Signed-in completion is the
  first variant.
- **Which sign-in link.** Cypress force-clicks the first "Log In" on the page,
  the top-bar link hidden behind the full-screen form. The journey uses the
  "Sign In" link the form offers, which has the same target. That link only
  carries the invitation as its return target after the form settles
  (`LoginBtn` computes it on mount without re-rendering), so the journey waits
  for the target before clicking.
- **New user's details.** Cypress looks for the name and email as page text;
  they are prefilled input values, which the journey asserts.
- **Dropped setup.** The Cypress `beforeEach` creates a second Collective, an
  Organization and a hosted Collective for the inviter that these tests never
  use.

Focused reproduction:

```bash
# The six journeys, fresh
./test/playwright/run-local.sh --spec test/playwright/specs/expenses --grep "invitation" --workers 3

# One journey, fresh
./test/playwright/run-local.sh --spec test/playwright/specs/expenses/invite-new-user.spec.ts --grep "emailed invoice"
./test/playwright/run-local.sh --spec test/playwright/specs/expenses/invite-organization-logged-out.spec.ts

# One journey against a retained populated stack and inbox
./test/playwright/run-local.sh --reuse --spec test/playwright/specs/expenses/invite-organization.spec.ts --grep "emailed reimbursement"

# First attempt fails with its invitation delivered and unanswered; the retry
# arranges new parties and must find its own message. Run another invitation
# spec with --reuse at the same time to check they do not interfere.
PLAYWRIGHT_ISOLATION_PROBE=1 ./test/playwright/run-local.sh --reuse \
  --spec test/playwright/specs/expenses/invite-organization.spec.ts --retries 1
```

After the probe, the failed attempt's `scenario` attachment names its
Collective and `inviteeAdmin`: its expense is still a draft without a payout
method and its mailbox holds exactly its one invitation, while the retry's
expense is pending.

Timings, measured on an 8-CPU Linux VM with retries disabled. Setup is the
`fixture-timings` attachment (one recipe request per journey). Mail wait is the
`mail-timings` attachment: from the inviter's confirmation to the message being
found in Mailpit. Execution is the rest of the reported duration and covers
both browsers. "Alone" is one journey on a fresh stack, where the first recipe
request and the first inbox lookup also warm the API and Mailpit; "shared" is
the median over three fresh runs of the whole selection with 3, 2 and 1
workers.

| Journey                             | Setup alone | Mail wait alone | Execution alone | Setup shared | Mail wait shared                 | Total shared |
| ----------------------------------- | ----------- | --------------- | --------------- | ------------ | -------------------------------- | ------------ |
| Organization submits, invoice       | 0.47 s      | 0.12 s          | 9.2 s           | 0.05 s       | 0.02 s                           | 11.6 s       |
| Organization submits, reimbursement | 0.48 s      | 0.13 s          | 9.7 s           | 0.06 s       | 0.02 s                           | 10.4 s       |
| logged out, invoice                 | 0.45 s      | 0.12 s          | 6.3 s           | 0.09 s       | 0.02 s                           | 7.7 s        |
| logged out, reimbursement           | 0.48 s      | 0.13 s          | 7.1 s           | 0.06 s       | 0.02 s                           | 8.2 s        |
| new user, invoice                   | 0.50 s      | 0.12 s          | 7.9 s           | 0.06 s       | 0.13 s (first lookup of the run) | 9.5 s        |
| new user, reimbursement             | 0.44 s      | 0.12 s          | 8.7 s           | 0.05 s       | 0.02 s                           | 9.3 s        |

The invitation is in the inbox 10-40 ms after the form confirms once the stack
is warm, so mail delivery is not a measurable part of these journeys; almost
all the time is the inviter filling the form. The six journeys take about 55 s
of test time when each runs alone and 46-67 s summed inside a shared run. The
whole 20-test selection takes 57 s of Playwright time with three workers, 67 s
with two and 106 s with one, after roughly 55 s of launcher startup on a fresh
stack. The Cypress timing supplied for the pilot (04:38) covers all 28 tests of
the original file, so it is not a like-for-like comparison for this group.

The measuring VM caps the session at 1228 processes and threads. The selection
peaks near 1080 with three workers and exceeds the cap with four, which shows
as `Target crashed` when a journey opens its second browser. Stay at three
workers on such a machine; the cap is not a property of the journeys.

## Expense management journeys (Playwright pilot)

`test/playwright/specs/expenses/` also carries the rest of the Cypress expense
pilot (`test/cypress/integration/27-expenses.test.ts`: `Actions on expense`,
`Recurring`, `Duplicate` and `Edit` blocks), which stays unchanged and
runnable. Thirteen Cypress tests map to eleven journeys:

| Cypress test                                                                            | Playwright journey (`specs/expenses/`)                                                                                             |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Actions on expense › Approve, unapprove, reject and pay actions on expense              | `process-expense.spec.ts` › Collective admin approves, unapproves and rejects an expense, leaving a comment for each reversal      |
| Actions on expense › Delete expense                                                     | `process-expense.spec.ts` › Collective admin deletes a rejected expense, which is then no longer available                         |
| Actions on expense › Downloads PDF                                                      | `process-expense.spec.ts` › Collective admin downloads the generated invoice of an expense as a PDF                                |
| Actions on expense › Displays expense policy                                            | `expense-policy.spec.ts` › Collective admin writes expense policies in the dashboard and submitters see them on the expense form   |
| Actions on expense › Projects inherit and display expense policy from parent collective | `expense-policy.spec.ts` › Collective with a Project › expense form of a Project shows the expense policy of its parent Collective |
| Invoices › Edit invoice expense › Edits title                                           | `edit-expense.spec.ts` › submitter renames their pending expense                                                                   |
| Reimbursements › Edit reimbursement expense › Edits title                               | the same journey (see "Editing" below)                                                                                             |
| Invoices › Edit invoice expense › Edits items                                           | `edit-expense.spec.ts` › submitter edits the items of their pending expense and switches its reference currency                    |
| Reimbursements › Edit reimbursement expense › Edits items                               | the same journey (see "Editing" below)                                                                                             |
| Invoices › Recurring › User can setup recurring invoice expense                         | `recurring-expense.spec.ts` › user submits an invoice set to recur every month                                                     |
| Reimbursements › Recurring › User can setup recurring reimbursement expense             | `recurring-expense.spec.ts` › user submits a reimbursement set to recur every month                                                |
| Invoices › Duplicate › Duplicates an invoice expense                                    | `duplicate-expense.spec.ts` › user duplicates an expense they submitted and sends the copy as an invoice                           |
| Reimbursements › Duplicate › Duplicates an reimbursement expense                        | `duplicate-expense.spec.ts` › user duplicates an expense they submitted and sends the copy as a reimbursement                      |

The transitions, edits and submissions go through the browser exactly as in
the source: status `Pending` → `Approved` → `Pending` (reason "Unapproved
once") → `Approved` → `Pending` ("Unapproved twice") → `Rejected` ("Rejected
once") with each reason shown as a comment; reject, delete through "More
actions", then "Page not found" on the expense URL; policies typed into the
dashboard and shown on the expense form; title set to "New title"; item 1
renamed, a `€100.00` item added, reference currency switched from the
preselected USD to EUR, giving `€11.00 EUR` (from `$10.00 USD`), `€100.00 EUR`
and a `€111.00 EUR` total at the fixed 1.1 exchange rate; a monthly recurrence
ending on Sep 29, 2125 confirmed in the summary before submitting; a duplicate
opened from the submitted expenses list, given a type, a date and (for a
reimbursement) a receipt, then submitted. Invoice files and receipts are real
local files stored through the API.

The downloaded invoice is produced by the real local PDF service, saved under
the attempt's own output directory and read back as text. The journey checks
the suggested name (`Expense-<id>-<collective slug>-invoice-<date>.pdf`) and
that the document names this attempt's expense number and title, Collective,
payee, billed host, item line and total. The API's stub for PDFs attached to
emails is untouched and not involved.

Where the journeys differ from the Cypress source, and why:

- **Own graph per journey.** Cypress creates one user and one Collective for
  the five `Actions on expense` tests, so the policy written by one test is
  still there for the next, and hangs everything on the seeded `e2e-host` or
  `apex`. Every journey arranges its own host, Collective, admin and expense
  with the `expense-management` recipe (or `expense-submission` with
  `priorExpense` for editing and duplicating). Policy text contains the
  attempt's Collective slug, and the policy journeys first check that both
  policy fields start empty.
- **No payment.** The Cypress title says "Approve, unapprove, reject and pay";
  nothing is paid in it, and nothing is paid here.
- **Deletion.** Added: the expense is listed for its Collective before the
  journey starts and is absent from that list after deletion, next to the
  source's "Page not found".
- **Policies.** Cypress types the same sentence into the invoice and the
  reimbursement policy and only looks at the invoice one. The first journey
  uses two different texts and checks each under its expense type. The Project
  journey arranges the Project up front instead of creating it after the
  policy edit; inheritance is read at display time, so the order does not
  change what is tested.
- **Editing.** Ticket and Cypress titles say both types, but the Cypress
  reimbursement variant creates its expense without a type, so both variants
  edit an invoice with identical steps. They are carried as one journey per
  behavior. Editing a real reimbursement (with receipts on its items) is not
  covered by either suite. The submitter here is not an admin of the
  Collective, as in the source.
- **Recurrence.** As in the source, the recurrence is configured and its
  confirmation sentence checked before submitting. The submitted expense page
  shows nothing about recurrence and no later prompt is produced, so nothing
  further is observable through the product.
- **Duplicate data.** Cypress asserts nothing about the copy. The journey
  checks what the form carried over before touching it (paying Collective,
  payee, saved payout method, item description and amount, title, tag; the
  date is not copied) and that the list then holds two pending expenses with
  the title and `$10.00`, the original still an invoice.
- **Download control.** Cypress force-clicks the first
  `download-expense-invoice-btn`; the journey clicks the visible "Download
  generated invoice" button. Cypress computes the date in the file name from
  the expense's creation time; the journey checks the name's shape with this
  attempt's expense number and Collective slug.
- **Direct navigation before acting.** Opening the expense through its link
  in the Collective's expense list and clicking "Reject" straight away lost the
  reason dialog once during development: the expense page loaded more data
  after showing its buttons and re-rendered without the open dialog. The
  journeys load the expense URL directly, as Cypress does, and have not shown
  this since.
- **Dropped setup.** For recurring and duplicate tests the Cypress `beforeEach`
  also creates a second Collective, an Organization and a hosted Collective
  for the user and wipes the shared inbox. None of that is used.

Focused reproduction:

```bash
# The eleven journeys, fresh
./test/playwright/run-local.sh --spec test/playwright/specs/expenses --workers 3 \
  --grep "Collective admin|Project|pending expense|recur every month|duplicates"

# One journey, fresh
./test/playwright/run-local.sh --spec test/playwright/specs/expenses/process-expense.spec.ts --grep "downloads the generated invoice"
./test/playwright/run-local.sh --spec test/playwright/specs/expenses/edit-expense.spec.ts --grep "edits the items"

# One journey against a retained populated stack
./test/playwright/run-local.sh --reuse --spec test/playwright/specs/expenses/expense-policy.spec.ts --grep "expense form of a Project"

# First attempts fail after a real unapproval, download, policy save or
# duplicate; each retry arranges a new graph and must start from a pending
# expense without comments, empty policies, or a single listed expense.
PLAYWRIGHT_ISOLATION_PROBE=1 ./test/playwright/run-local.sh --reuse --retries 1 --workers 2 \
  --spec test/playwright/specs/expenses --grep "Collective admin|duplicates"
```

After the probe, a failed attempt's download stays in its own
`test-results/<test>-chromium/downloads/` directory and the retry's copy in
`<test>-chromium-retry1/downloads/`, each naming a different expense.

Timings, measured on an 8-CPU Linux VM with retries disabled. Setup is the
`fixture-timings` attachment (one recipe request per journey); execution is
the rest of the test's reported duration and includes the PDF service for the
download journey. "Alone" is one journey on a fresh stack, where the first
recipe request also warms the API (about 0.4 s); "shared" is the median over
three fresh runs of the whole selection with 3, 2 and 3 workers.

| Journey                           | Setup alone | Execution alone | Setup shared | Total shared |
| --------------------------------- | ----------- | --------------- | ------------ | ------------ |
| approve, unapprove, reject        | 0.49 s      | 3.6 s           | 0.06 s       | 4.3 s        |
| delete rejected expense           | 0.51 s      | 4.0 s           | 0.06 s       | 4.8 s        |
| download invoice PDF              | 0.50 s      | 2.0 s           | 0.06 s       | 2.0 s        |
| write and display policies        | 0.47 s      | 3.8 s           | 0.08 s       | 5.7 s        |
| Project shows parent policy       | 0.46 s      | 2.8 s           | 0.09 s       | 3.6 s        |
| rename expense                    | 0.52 s      | 1.9 s           | 0.08 s       | 2.8 s        |
| edit items and reference currency | 0.54 s      | 2.6 s           | 0.16 s       | 3.7 s        |
| recurring invoice                 | 0.50 s      | 6.1 s           | 0.06 s       | 8.0 s        |
| recurring reimbursement           | 0.50 s      | 7.0 s           | 0.05 s       | 7.9 s        |
| duplicate as invoice              | 0.50 s      | 2.7 s           | 0.07 s       | 4.1 s        |
| duplicate as reimbursement        | 0.46 s      | 2.8 s           | 0.08 s       | 4.0 s        |

Arranging a host, Collective, admin, expense and Project costs 0.04-0.36 s per
journey once the API is warm (median 0.07 s), a few percent of even the
shortest journey.
The eleven journeys take about 45 s of test time when each runs alone and
about 51 s summed inside a shared run. The whole 31-test selection takes 74 s
of Playwright time with three workers, 86 s with two and 148 s with one, after
roughly 55 s of launcher startup on a fresh stack. The Cypress timing supplied
for the pilot (04:38) covers all 28 tests of the original file, which the
three expense groups now cover with 26 Playwright journeys.

## Vendor picker journeys (Playwright pilot)

`test/playwright/specs/vendors/` carries the picker half of the Cypress vendor
pilot (`test/cypress/integration/41-vendor-visibility.test.ts`: `vendor picker
on expense submission`, `vendor picker on grant submission` and `Add Funds
source picker`), which stays unchanged and runnable. The `inline vendor
creation defaults` and `vendor settings dashboard` blocks of that file are not
part of this group. Sixteen Cypress tests map to fifteen journeys:

| Cypress test                                                                                                            | Playwright journey (`specs/vendors/`)                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| expense › non-admin: shows the usable vendor and hides one scoped to a different collective in the same picker          | `vendor-scope.spec.ts` › Collective admin is offered the vendor scoped to their Collective and not the one scoped to another       |
| expense › admin of collective A only sees A-scoped vendors when paying from A                                           | the same journey (identical graph and assertions in the source)                                                                    |
| expense › shows a vendor that can be used on any hosted collective                                                      | `vendor-scope.spec.ts` › host admin is offered an unscoped vendor when paying from any hosted Collective                           |
| expense › non-admin: host-scoped vendor is hidden on a hosted collective expense form                                   | `vendor-scope.spec.ts` › Collective admin is not offered a host-scoped vendor when paying from their Collective                    |
| expense › host admin: sees host-scoped vendor on every expense form                                                     | `vendor-scope.spec.ts` › host admin is offered a host-scoped vendor when paying from the host and from a hosted Collective         |
| expense › shows a vendor scoped to the parent collective when paying from a child project                               | `vendor-project-scope.spec.ts` › host admin paying from a Project is offered a vendor scoped to its parent Collective              |
| expense › vendor scope propagates to child account                                                                      | `vendor-project-scope.spec.ts` › Collective admin paying from a Project is offered vendors scoped to the Project and to its parent |
| expense › does not show a vendor from a different host                                                                  | `vendor-foreign-host.spec.ts` › host admin is not offered a vendor of another host                                                 |
| expense › does not show a vendor from another host even when the user is admin of both hosts                            | `vendor-foreign-host.spec.ts` › admin of two hosts is not offered a vendor of the host that does not hold the paying Collective    |
| expense › does not show a vender from another host                                                                      | `vendor-policy.spec.ts` › admin of a Collective on another host is only offered vendors that follow a host open to all submitters  |
| expense › vendor HOST_ADMINS policy override host ALL_SUBMITTERS policy                                                 | `vendor-policy.spec.ts` › Collective admin is not offered a vendor restricted to host admins on a host open to all submitters      |
| expense › vendor ALL_SUBMITTERS policy override host HOST_ADMINS policy                                                 | `vendor-policy.spec.ts` › Collective admin is offered a vendor open to all submitters on a host restricted to host admins          |
| expense › host ALL_SUBMITTERS policy is overriden by more strict vendor policy                                          | `vendor-policy.spec.ts` › submitter without any role is only offered vendors that follow a host open to all submitters             |
| grant › grant beneficiary picker shows a vendor scoped to the paying collective                                         | `grant-beneficiary.spec.ts` › host admin is offered a beneficiary scoped to the Collective granting the funds                      |
| grant › collective admin of paying account can submit a grant to a scoped beneficiary                                   | `grant-beneficiary.spec.ts` › Collective admin submits a grant request to a beneficiary scoped to their Collective                 |
| Add Funds source picker › shows the usable vendor and hides one scoped to a different collective in the source dropdown | `add-funds-source.spec.ts` › host admin adding funds to a Collective finds the vendor scoped to it as the source                   |

Every outcome is read from the picker the user works with, as in the source:
"A vendor" on `/<account>/expenses/new`, "A beneficiary" on
`/<account>/grants/new`, and the source field of the Add Funds dialog opened
from the host's hosted-Collectives dashboard. The grant journey fills the
request (title, item, 1,000.00), checks the beneficiary on the summary, submits
and sees "Grant request #... has been submitted successfully!" and the pending
grant. Nothing is decided by a fixture or API assertion.

Each journey arranges its own host, Collective, actors, vendors and host policy
with the `vendor-host` recipe; no seeded host is used and no policy is changed
after setup. A host only has a vendor policy when the journey names one, so
journeys with different policies run side by side without seeing each other.
The source asserts no balances or counts, and neither do the journeys; the
grant journey leaves one pending grant on a Collective nothing else reads.

`helpers/vendor-picker.ts` holds the picker steps. `expectVendorChoices`
requires at least one vendor that must be offered and looks for it first: a
vendor is only reported as withheld from a list that has demonstrably loaded.
`expectVendorNotFound` types the vendor's whole name, waits for the answer to
that exact search and for the picker's finished state ("No options", or an
enabled "Create vendor: ..." for a host admin) before checking it is absent.
There are no fixed delays.

Where the journeys differ from the Cypress source, and why:

- **Absence anchored to a loaded picker.** The two foreign-host tests assert
  only that a name is absent, which also holds for a picker that never loaded.
  Both journeys add `ownVendor` on the paying Collective's host, see it listed,
  and only then check the other host's vendor is missing. In the other
  absence tests the source already arranges a visible vendor but does not
  order the checks; the helper always waits for the offered vendor first.
- **Searching for the withheld vendor (added).** The source only reads the
  list the picker opens with, which the form loads with its own query. A user
  can also type, which asks a different API. The scope and foreign-host
  journeys therefore also search for the withheld vendor by name and check
  the completed search does not offer it (four journeys: scoped to another
  Collective, scoped to the host, other host, other host with a shared admin).
- **Policy journeys assert on the opening list.** That is where the source
  asserts host and vendor policies, and the four policy journeys keep it there;
  they do not type a search.
- **Project journeys rely on the preloaded list.** From a Project's form,
  typing the name of a vendor scoped to the parent Collective returns nothing
  from the API search; the vendor stays listed because the picker also filters
  its preloaded five. This is not asserted and is reported with this group.
- **Add Funds.** The source types the usable vendor's name and then checks the
  other vendor is not shown; that vendor would not match the search whatever
  its scope. The journey keeps exactly that (search by name, the vendor is
  offered, the other is not listed) and is named for what it shows. Scope does
  not restrict this picker for the people who can open it: the API drops the
  scope filter for host admins, and a search matching both vendors lists both
  (observed). The source uses a fixed 150 ms wait and typing delay here; the
  journey waits for the answer to its search. No funds are added, as in the
  source.
- **One journey for two identical tests.** "non-admin: shows the usable
  vendor..." and "admin of collective A only sees A-scoped vendors..." build
  the same graph and assert the same two names.
- **Misleading title.** "does not show a vender from another host" has no
  vendor on another host: the actor administers a Collective on another host
  and sees only vendors that follow the open host policy. It is mapped by what
  it tests.
- **Host admin on two forms.** The source signs in twice as the same host
  admin; the journey visits both forms in one session.
- **Arranged, not created through the API.** Cypress signs users up and calls
  `createHostOrganization`, `createCollectiveV2`, `createProject`,
  `createVendor` and `setPolicies`. The recipe writes the same state in one
  request: vendors with `canBeUsedWithAccountIds` and `useVendorPolicy` as
  `createVendor` stores them (scoped only to their host or Accounts it holds),
  the policy under the host's `policies`, grants enabled in the Collective's
  settings. Vendor names are `<label> <attempt tag>`, short enough to be shown
  whole in the picker and unique on a populated database, instead of a random
  suffix.
- **Grant submission.** Added: the beneficiary and the amount are checked on
  the summary before submitting. The source's final `Grant #` check is kept.
- **Waiting for the form, not for time.** The expense form preselects the
  user's own profile when it finishes loading, even if "A vendor" was clicked
  just before; `openVendorPicker` waits for that preselection, then chooses the
  vendor option and checks it stays chosen. The grant form resets its items
  once after a beneficiary is picked, which can undo items typed immediately
  afterwards; nothing on screen marks that moment, so the journey fills the
  items again until the summary opens, as a user reading the validation
  message would. Both were seen as rare first-attempt failures while repeating
  the journeys on a warm stack, before these waits existed.

Focused reproduction:

```bash
# The fifteen journeys, fresh
./test/playwright/run-local.sh --spec test/playwright/specs/vendors --workers 3

# One journey, fresh
./test/playwright/run-local.sh --spec test/playwright/specs/vendors/vendor-foreign-host.spec.ts --grep "admin of two hosts"
./test/playwright/run-local.sh --spec test/playwright/specs/vendors/grant-beneficiary.spec.ts --grep "submits a grant request"

# One journey against a retained populated stack
./test/playwright/run-local.sh --reuse --spec test/playwright/specs/vendors/vendor-policy.spec.ts --grep "submitter without any role"

# First attempts fail with a loaded picker or a submitted grant behind them;
# each retry arranges a new host, policy, vendors and actors.
PLAYWRIGHT_ISOLATION_PROBE=1 ./test/playwright/run-local.sh --reuse --retries 1 --workers 2 \
  --spec test/playwright/specs/vendors --grep "scoped to their Collective"
```

Timings, measured on an 8-CPU Linux VM with retries disabled. Setup is the
`fixture-timings` attachment (one recipe request per journey); execution is
the rest of the test's reported duration. "Alone" is one journey on a fresh
stack, where the first recipe request also warms the API (about 0.4 s);
"shared" is the median over three fresh runs of the whole selection with 3, 2
and 3 workers.

| Journey                                       | Setup alone | Execution alone | Setup shared | Total shared |
| --------------------------------------------- | ----------- | --------------- | ------------ | ------------ |
| scoped to own versus another Collective       | 0.46 s      | 2.7 s           | 0.07 s       | 3.3 s        |
| unscoped vendor, host admin                   | 0.45 s      | 1.9 s           | 0.05 s       | 1.8 s        |
| host-scoped vendor, Collective admin          | 0.47 s      | 2.7 s           | 0.05 s       | 2.6 s        |
| host-scoped vendor, host admin on two forms   | 0.44 s      | 3.1 s           | 0.04 s       | 3.0 s        |
| Project, vendor scoped to parent              | 0.44 s      | 2.0 s           | 0.05 s       | 2.5 s        |
| Project, vendors scoped to Project and parent | 0.42 s      | 1.9 s           | 0.06 s       | 2.3 s        |
| vendor of another host                        | 0.46 s      | 2.8 s           | 0.10 s       | 3.5 s        |
| vendor of another host, admin of both         | 0.45 s      | 2.8 s           | 0.14 s       | 3.1 s        |
| vendor restricted to host admins              | 0.44 s      | 2.0 s           | 0.06 s       | 2.3 s        |
| vendor open to all on a restricted host       | 0.45 s      | 1.9 s           | 0.09 s       | 2.6 s        |
| submitter without any role                    | 0.42 s      | 1.9 s           | 0.05 s       | 2.5 s        |
| admin of a Collective on another host         | 0.46 s      | 1.9 s           | 0.11 s       | 2.4 s        |
| grant beneficiary offered                     | 0.44 s      | 1.8 s           | 0.05 s       | 2.1 s        |
| grant request submitted                       | 0.45 s      | 3.0 s           | 0.06 s       | 3.8 s        |
| Add Funds source                              | 0.46 s      | 2.8 s           | 0.09 s       | 2.9 s        |

Arranging one or two hosts, their Collectives, actors and up to three vendors
costs 0.03-0.20 s per journey once the API is warm (median 0.05 s), a few
percent of even the shortest journey. The fifteen journeys take about 42 s of
test time when each runs alone and about 42 s summed inside a shared run. The
whole 46-test selection takes about 85 s of Playwright time with three
workers, 106 s with two and 170 s with one, after roughly 55 s of launcher
startup on a fresh stack. The Cypress timing supplied for the pilot (01:57)
covers all 23 tests of the original file, of which these journeys cover 16.

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
