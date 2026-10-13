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

## Building for upload journeys

Build the frontend with the CI environment before running journeys that upload
files; `DISABLE_MOCK_UPLOADS` is compiled into the bundle:

```bash
TZ=UTC OC_ENV=ci NODE_ENV=test WEBSITE_URL=http://localhost:3000 API_URL=http://localhost:3060 \
  PDF_SERVICE_URL=http://localhost:3002 API_KEY=dvl-1510egmf4a23d80342403fb599qd \
  DISABLE_MOCK_UPLOADS=1 npm run build
```

The object store needs the `opencollective-e2e` bucket (see the canonical guide).

## Mutable fixtures

Typed recipes and independent mutable journeys live under `fixtures/` and
`specs/account-*.spec.ts`. Run all pilot coverage with
`./test/playwright/run-local.sh --spec test/playwright/specs --workers 2`.
Fixture authoring, safe reuse, intentional failure/retry checks and API
interruption checks are documented in the canonical [guide](../../docs/e2e.md#authoring-independent-playwright-fixtures).
The companion API branch is required; ordinary Cypress startup does not enable
the fixture endpoint. Credentials stay outside uploaded evidence and are
redacted from traces and textual artifacts by the launcher.

## Expense submission journeys

`specs/expenses/` holds the submission journeys of the expense pilot: logged-out
entry points, first invoice and reimbursement, a returning submitter, inline
legal entity, invoice VAT and a draft that keeps its currency.

```bash
./test/playwright/run-local.sh --spec test/playwright/specs/expenses --workers 3
./test/playwright/run-local.sh --spec test/playwright/specs/expenses/submit-first-expense.spec.ts --grep "first invoice"
```

They use `scenarioTest` with the `expense-submission` and `expense-draft-invite`
recipes, `helpers/expense-form.ts` and `helpers/uploads.ts`. Coverage mapping
against the Cypress suite, differences, and setup versus execution timings are
in the canonical [guide](../../docs/e2e.md#expense-submission-journeys-playwright-pilot).

## Expense invitation journeys

`specs/expenses/invite-*.spec.ts` holds the invitation journeys of the expense
pilot: an existing Organization, a logged-out recipient and a person without an
account, each for invoices and reimbursements. The invitation is sent through
the form, delivered over local SMTP and followed from Mailpit in a second
browser.

```bash
./test/playwright/run-local.sh --spec test/playwright/specs/expenses --grep "invitation" --workers 3
./test/playwright/run-local.sh --spec test/playwright/specs/expenses/invite-new-user.spec.ts --grep "emailed invoice"
```

They use the `mail` fixture (`helpers/mail.ts`: attempt-owned recipients, the
shared inbox is never cleared), `openBrowserAs` for the recipient's browser and
the `inviteeOrganization` option of the `expense-submission` recipe. Mail
correlation rules, coverage mapping, differences and timings are in the
canonical [guide](../../docs/e2e.md#expense-invitation-journeys-playwright-pilot).

`process-expense`, `expense-policy`, `edit-expense`, `recurring-expense` and
`duplicate-expense` specs in the same directory hold the management journeys:
approve/unapprove/reject, deletion, invoice PDF download, expense policies
(including a Project inheriting its parent's), title and item edits,
recurrence and duplication.

```bash
./test/playwright/run-local.sh --spec test/playwright/specs/expenses --workers 3 \
  --grep "Collective admin|Project|pending expense|recur every month|duplicates"
./test/playwright/run-local.sh --spec test/playwright/specs/expenses/process-expense.spec.ts --grep "downloads the generated invoice"
```

They use the `expense-management` recipe (Collective admin, optional pending
expense and Project) or `expense-submission`, and `helpers/downloads.ts`
(`downloadPdf`: attempt-owned download path, text of the PDF rendered by the
local PDF service). Coverage mapping, differences from Cypress and timings are
in the canonical [guide](../../docs/e2e.md#expense-management-journeys-playwright-pilot).

## Vendor picker journeys

`specs/vendors/` holds the picker half of the vendor pilot: which vendors the
expense form, the grant form and the Add Funds dialog offer, depending on the
vendor's scope and host, the host and vendor policies, and who is asking; plus
a grant request submitted to a scoped beneficiary.

```bash
./test/playwright/run-local.sh --spec test/playwright/specs/vendors --workers 3
./test/playwright/run-local.sh --spec test/playwright/specs/vendors/vendor-policy.spec.ts --grep "submitter without any role"
```

They use the `vendor-host` recipe (an attempt-owned host with its policy,
Collectives, a Project, a second host, and named vendors in
`scenario.vendors`) and `helpers/vendor-picker.ts`, whose `expectVendorChoices`
only reports a vendor as withheld after seeing one that must be offered.
Coverage mapping, differences from Cypress, product behavior the journeys
deliberately do not assert, and timings are in the canonical
[guide](../../docs/e2e.md#vendor-picker-journeys-playwright-pilot).

## Vendor creation and settings journeys

`specs/vendors/vendor-creation.spec.ts` and `vendor-settings.spec.ts` hold the
other half of the vendor pilot: a host admin creating a vendor from the Add
Funds dialog, the expense form, the expected funds dialog and the grant form,
then editing a vendor's scope and policy, creating one on the vendors
dashboard, and changing the host's vendor policy in the host settings.

```bash
./test/playwright/run-local.sh --workers 3 --spec test/playwright/specs/vendors \
  --grep "created|limits a vendor|take up a vendor policy"
./test/playwright/run-local.sh --spec test/playwright/specs/vendors/vendor-settings.spec.ts --grep "take up a vendor policy"
```

They use the `vendor-host` recipe (which also returns the host dashboard URLs
`vendors` and `expectedFunds`), `createVendorInline` in
`helpers/vendor-picker.ts`, `helpers/vendor-dashboard.ts` for the vendor's
settings form, and `openBrowserAs` to show the outcome in the Collective
admin's own picker. Coverage mapping, differences from Cypress, timings, and
the reconciliation of both pilot Cypress files with all Playwright journeys are
in the canonical
[guide](../../docs/e2e.md#vendor-creation-and-settings-journeys-playwright-pilot).
