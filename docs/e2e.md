# E2E (end-to-end) tests

We use [Cypress](https://www.cypress.io/) for E2E (end-to-end) tests.

## Writing E2E tests

See the following guide in our documentation:
https://docs.opencollective.com/help/developers/testing-with-cypress

## Running the E2E tests in development environment

In dev environment, to execute the E2E tests, you will need to open 4 different terminals in 2 different projects.

### 1. API: Server

To make sure tests are properly reproduceable, you will need to setup the Open Collective API locally.

We recommend to run a build and not the development environment.

- clone and install [opencollective-api](https://github.com/opencollective/opencollective-api)
- `NODE_ENV=e2e npm run build`

We also recommend to restore the development dump of the database before you start the tests.

- `npm run db:restore && npm run db:migrate`

Then start the API:

- `TZ=UTC NODE_ENV=e2e E2E_TEST=1 MAILDEV=1 npm run start`

### 2. API: Maildev

Some tests are relying on Maildev to check that emails are properly sent.

From the the API repository, start Maildev with:

- `npm run maildev`

### 3. Frontend: Server

We recommend to run a production build of the Frontend. It will be faster and more reliable.

- clone and install [opencollective-frontend](https://github.com/opencollective/opencollective-frontend)
- `NODE_ENV=e2e npm run build`
- `TZ=UTC NODE_ENV=e2e npm run start`

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
