# opencollective-frontend

Next.js/React UI. Prefer user-facing "Contribution" over "Order", and "Account" over "Collective" where the GraphQL API uses Account.

## Stack

Tailwind+ShadCN (primary), Styled Components/Styled System (legacy; do not add new usage). Lucide (primary), Styled Icons (legacy). Apollo Client, Formik+Zod (`FormikZod` wraps Formik with Zod), React Intl. Jest/RTL + Cypress E2E.

## Rules

- Reuse existing i18n strings (workspace skill `search-i18n-translations`). English source: `lang/en.json`. After i18n source changes, `npm run build:langs` and `npm run langs:check`.
- New UI: Tailwind/ShadCN and Lucide, not styled-components or Styled Icons.

## Quality

From this repo: `npm run type:check`, `npm run lint:quiet`, `npm run prettier:check` (fix: `prettier:write`), npm run `ts-unused-exports`.
Tests: Jest (`npm run test`); E2E Cypress + Playwright pilot (`docs/e2e.md`, `test/playwright/README.md`).
Schema/codegen: `npm run graphql:update` (API must be running).

## Playwright E2E (pilot)

Fresh Linux reproduction: `./test/playwright/run-local.sh --spec test/playwright/specs/smoke.spec.ts`.
Uses disposable `opencollective_pw_e2e` by default; explicit service paths via `--api-dir/--frontend-dir/--images-dir/--pdf-dir` for worktrees.
Evidence: `test/playwright/.artifacts/<run-id>/replay-manifest.json` plus owned service logs.
Replay: `--replay <manifest>` (validates inputs, runs fresh). Iteration: `--reuse` (joins live env, no reset). Cleanup: `--cleanup` (refuses while active users remain).
CI pilot (`CI / e2e-playwright / playwright smoke`): observational, same launcher; failure evidence 14d, success 7d.
