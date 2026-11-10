# opencollective-frontend

Next.js/React UI. Prefer user-facing "Contribution" over "Order", and "Account" over "Collective" where the GraphQL API uses Account.

## Stack

Tailwind+ShadCN (primary), Styled Components/Styled System (legacy; do not add new usage). Lucide (primary), Styled Icons (legacy). Apollo Client, Formik+Zod (`FormikZod` wraps Formik with Zod), React Intl. Jest/RTL + Cypress E2E.

## Rules

- Reuse existing i18n strings (workspace skill `i18n-frontend-search-translations`). English source: `lang/en.json`. After i18n source changes, `npm run build:langs` and `npm run langs:check`.
- New UI: Tailwind/ShadCN and Lucide, not styled-components or Styled Icons.

## Cross-repository features

When a feature also changes `opencollective-api`, use the same branch name in both repositories and push both branches. E2E CI in either repository automatically checks out the matching branch in the other repository when available, falling back to `main` otherwise.

## Quality

From this repo: `npm run type:check`, `npm run lint:quiet`, `npm run prettier:check` (fix: `prettier:write`), npm run `ts-unused-exports`.
Tests: Jest (`npm run test`); E2E Cypress + Playwright pilot (`docs/e2e.md`, `test/playwright/README.md`).
Schema/codegen: `npm run graphql:update` (API must be running).

## Playwright E2E (pilot)

Run a spec: `npm run e2e -- <spec> [playwright args]` installs, builds what changed (build stamps), and joins or starts an E2E environment that stays running; `--fresh`, `--rebuild <service>`, `npm run e2e:stop`. Guide: [`docs/e2e.md`](docs/e2e.md#run-a-spec).
Services resolve from `API_FOLDER`/`--api-dir` (and images/PDF), then `../opencollective-*`, then `./opencollective-*`; in a worktree, create matching service worktrees under the same `.worktrees/<feature>/`.
Fresh run (CI contract, no install or build): `./test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts`, disposable `opencollective_pw_e2e` by default.
Evidence: `test/playwright/.artifacts/<run-id>/replay-manifest.json` plus owned service logs.
Replay: `--replay <manifest>` (validates inputs, runs fresh). Join a running E2E environment without install, build or reset: `--reuse`. Cleanup: `--cleanup` (refuses while active users remain).
Mutable journeys: `test/playwright/fixtures` (`test`, `scenarioTest`) with API recipes; pilot specs in `test/playwright/specs/**`. Upload journeys need a frontend built with `DISABLE_MOCK_UPLOADS=1` (`docs/e2e.md`).
CI pilot (`CI / e2e-playwright / playwright smoke`): observational, same launcher; failure evidence 14d, success 7d.
