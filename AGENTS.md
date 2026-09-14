# opencollective-frontend

Next.js/React UI. Prefer user-facing "Contribution" over "Order", and "Account" over "Collective" where the GraphQL API uses Account.

## Stack

Tailwind+ShadCN (primary), Styled Components/Styled System (legacy; do not add new usage). Lucide (primary), Styled Icons (legacy). Apollo Client, Formik+Zod (`FormikZod` wraps Formik with Zod), React Intl. Jest/RTL + Cypress E2E.

## Rules

- Reuse existing i18n strings (workspace skill `search-i18n-translations`). English source: `lang/en.json`. After i18n source changes, `npm run build:langs` and `npm run langs:check`.
- New UI: Tailwind/ShadCN and Lucide, not styled-components or Styled Icons.

## Quality

From this repo: `npm run type:check`, `npm run lint:quiet`, `npm run prettier:check` (fix: `prettier:write`). Tests: Jest (`npm run test`); E2E Cypress. Schema/codegen: `npm run graphql:update` (API must be running).
