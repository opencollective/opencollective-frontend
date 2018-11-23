# Open Collective Frontend

[![Circle CI](https://circleci.com/gh/opencollective/opencollective-frontend/tree/master.svg?style=shield)](https://circleci.com/gh/opencollective/opencollective-frontend/tree/master)
[![Slack Status](https://slack.opencollective.org/badge.svg)](https://slack.opencollective.org)
[![Dependency Status](https://david-dm.org/opencollective/opencollective-frontend/status.svg)](https://david-dm.org/opencollective/opencollective-frontend)
[![Greenkeeper badge](https://badges.greenkeeper.io/opencollective/opencollective-frontend.svg)](https://greenkeeper.io/)

<p align="center">
  <a href="https://github.com/opencollective/opencollective-frontend">
    <img width="525"src="http://res.cloudinary.com/opencollective/image/upload/c_scale,w_1050/v1536861775/opencollective-babel-2018-09-13_ue8yhg.png" alt="Babel - Open Collective">
  </a>
</p>

## Foreword

If you see a step below that could be improved (or is outdated), please update the instructions. We rarely go through this process ourselves, so your fresh pair of eyes and your recent experience with it, makes you the best candidate to improve them for other users. Thank you!

## Development

### Prerequisite

1. Make sure you have Node.js version >= 10.

- We recommend using [nvm](https://github.com/creationix/nvm): `nvm use`.

### Install

We recommend cloning the repository in a folder dedicated to `opencollective` projects.

```
git clone git@github.com:opencollective/opencollective-frontend.git opencollective/frontend
cd opencollective/frontend
npm install
```

### Environment variables

This project requires an access to the Open Collective API. You have two options:

- `cp .env-staging .env` to connect to the Open Collective staging API
- `cp .env-local .env` to connect to the API running locally

If you decide to pick the local strategy, make sure you install and run the [opencollective-api](https://github.com/opencollective/opencollective-api) project.

### Start

```
npm run dev
```

## Contributing

Code style? Commit convention? Please check our [Contributing guidelines](CONTRIBUTING.md).

TL;DR: we use [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/), we do like great commit messages and clean Git history.

## Tests

You can run the tests using `npm test` or more specifically:

- `npm run test:src` for pages and components
- `npm run test:server` for api
- `npm run test:e2e` for end-to-end tests using [Cypress](https://www.cypress.io/)

To update the Jest snapshots, run `npm run test:update`
To update the graphql schema for eslint, run `npm run graphql:get-schema:dev`

## Localization

To add a translation to a new language, copy paste the `en.json` from `src/lang` and rename the copy using the 2 or 4 letter code for your country/language (e.g. `fr-BE.json` or `fr.json`).

You will also need to copy paste the last line in `scripts/translate.js`, and replace `ja` with your 2-4 letter locale code.

```
fs.writeFileSync(`${LANG_DIR}ja.json`, JSON.stringify(translatedMessages('ja'), null, 2));
```

## Deployment

To deploy to staging or production, you need to be a core member of the Open Collective team.

### (Optional) Configure Slack token

Setting a Slack token will post a message on `#engineering` with the changes you're
about to deploy. It is not required, but you can activate it like this:

1. Go to https://api.slack.com/custom-integrations/legacy-tokens
2. Generate a token for the OpenCollective workspace
3. Add this token to your `.env` file:

```bash
OC_SLACK_USER_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Staging (heroku)

```bash
# Before first deployment, configure staging remote
git remote add staging https://git.heroku.com/oc-staging-frontend.git

# Then deploy master with
npm run deploy:staging
```

URL: https://staging.opencollective.com/

### Production (heroku)

```bash
# Before first deployment, configure production remote
git remote add production https://git.heroku.com/oc-prod-frontend.git

# Then deploy master with
npm run deploy:production
```

URL: https://opencollective.com/
