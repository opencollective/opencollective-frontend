# Pilot evaluation

Tooling for the evaluation of the expense and vendor Playwright pilots
(opencollective/opencollective#8969): a coverage inventory, the summary of a
paired Cypress/Playwright benchmark and a full-CI baseline. The benchmark and
independence-check scaffolding is not part of this branch; it lives on the
pushed branch
[`feat/playwright-pilot-evaluation-8969`](https://github.com/opencollective/opencollective-frontend/tree/feat/playwright-pilot-evaluation-8969).
Commands run from the frontend root with Node 24, which runs these TypeScript
files directly.

## Coverage inventory

```bash
node test/playwright/evaluation/cli.ts inventory --markdown /tmp/inventory.md
```

`pilot-inventory.ts` lists every test of `test/cypress/integration/27-expenses.test.ts`
and `41-vendor-visibility.test.ts` with the Playwright journeys that carry it,
an explicit consolidation or partial mapping (`note`), or an explicit `gap`.
The command reads the Cypress `it(` titles from the sources (a `${...}`
placeholder matches either expense type), lists the Playwright tests with
`playwright test --list`, and exits non-zero when a Cypress test is not in the
inventory, an entry names a test or journey that no longer exists, or a pilot
journey is claimed by no entry. A recorded gap keeps the inventory complete
but reports that not every core flow is carried by a journey.

## Benchmark pairs (scaffolding)

The scaffolding below (the workflow and the scripts it calls) is only on
`feat/playwright-pilot-evaluation-8969`; check out that branch to reproduce
the runs. `cli.ts collect-run` and `cli.ts aggregate` stay here.

On that branch, `.github/workflows/e2e-pilot-benchmark.yml` runs when
`test/playwright/evaluation/benchmark-plan.json` changes. The plan pins the API,
images and PDF revisions and lists the matrix jobs. A `pair` job
(`bench-pair.sh`) runs both pilot suites with each runner, one after the
other on the same machine, in the plan's order:

- Playwright: `run-local.sh --spec 'test/playwright/specs/(expenses|vendors)/' --workers N --retries 0`.
- Cypress: `cypress-baseline.sh`, which mirrors the required shards
  (`scripts/setup_db.sh`, `scripts/run_e2e_tests.sh`) for the two pilot files
  through the Cypress module API (`run-cypress.ts`). Differences, all to match
  the Playwright side: database restored with the runner's `pg_restore`; the
  job's Mailpit; no Stripe listener (neither file uses Stripe); Playwright's
  Chromium binary; in parallel mode the two files run as two concurrent
  `cypress run` processes on the one stack.

Both runners use the same prepared builds (built once per workflow run, like
`ci.yml`), the same service containers, `TZ=UTC`, `en-US`, a 1200x1660
viewport, and no retries. Each runner writes `run-<batch>-<pair>-<runner>.json`
(`cli.ts collect-run`): phases from its timestamped log (preflight, database
reset, service startup, runner boot, browser, teardown, total critical path),
every test with its duration (plus recipe setup and mail waits for
Playwright), and artifact size. `resources.tsv` samples load, memory and
threads every 5 s; `machine.txt` records revisions and versions.

```bash
gh run download <run id> -R opencollective/opencollective-frontend -D /tmp/bench
node test/playwright/evaluation/cli.ts aggregate /tmp/bench --json summary.json --markdown summary.md
```

Wall-time statistics use runs whose tests all passed; every other outcome is
counted and listed. Paired comparisons are Cypress minus Playwright total
critical path within one job, overall and per batch.

## Independence checks (scaffolding)

Also only on `feat/playwright-pilot-evaluation-8969`. Plan entries with `task: alone-fresh` (sharded) or `task: populated` run
`independence.sh`: every pilot test alone on a fresh stack; and on one
retained stack a controlled failure, a probe run kept on failure, every test
alone with `--reuse`, the whole selection with 1 and 4 workers, the two
suites as concurrent joiners, a probe run with one retry (replacement
workers) and the API fixture HTTP checks. `invocations.jsonl` records each
launcher invocation.

## Full-CI baseline

```bash
node test/playwright/evaluation/cli.ts baseline --limit 40 --json baseline.json
```

Summarizes recent `CI` runs on `main`: the five required Cypress shards (wall
time from first start to last finish, summed job minutes, per-shard failures)
and, separately, the duplicate Playwright pilot job.
