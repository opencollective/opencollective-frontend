# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is the **Open Collective Frontend** — a Next.js 15 / React 19 web application with a custom Express server. It communicates with a separate GraphQL API backend (`opencollective-api`) via Apollo Client. By default, it connects to the **staging API** at `api-staging.opencollective.com`, so no local API setup is required for development.

### Node.js version

The project requires **Node.js 24.x** (see `.nvmrc` and `package.json` engines). Use `nvm use` to activate the correct version.

### Key commands

See `package.json` scripts. The most important ones:

| Task                 | Command                           |
| -------------------- | --------------------------------- |
| Dev server           | `npm run dev` (runs on port 3000) |
| Lint                 | `npm run lint`                    |
| Unit/component tests | `npm test`                        |
| Type check           | `npm run type:check`              |
| Prettier check       | `npm run prettier:check`          |

### Dev server notes

- `npm run dev` runs `node server` which starts a custom Express server wrapping Next.js. It does **not** use `next dev` directly.
- The server logs `Ready on http://localhost:3000` when fully started. First request after startup triggers Next.js compilation for that page, so initial page loads may be slow.
- By default the frontend connects to the staging API — no `.env` file is needed for basic development.
- To connect to a local API, create a `.env` file with `API_URL=http://localhost:3060`.

### Testing notes

- Jest tests run with `npm test` and cover `components/`, `lib/`, and `pages/` directories.
- E2E tests use Cypress and require a full local stack (API + PostgreSQL + Mailpit). See `docs/e2e.md` for setup.
- Lint produces ~1000 warnings (no errors) which is expected.

### Git hooks

Husky v4 pre-commit hook runs `lint-staged` (prettier on `*.{js,json,md,graphql}` files). This runs automatically on commit.
