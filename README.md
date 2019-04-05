# Open Collective Frontend

[![Circle CI](https://circleci.com/gh/opencollective/opencollective-frontend/tree/master.svg?style=shield)](https://circleci.com/gh/opencollective/opencollective-frontend/tree/master)
[![Slack Status](https://slack.opencollective.org/badge.svg)](https://slack.opencollective.org)
[![Dependency Status](https://david-dm.org/opencollective/opencollective-frontend/status.svg)](https://david-dm.org/opencollective/opencollective-frontend)
[![Greenkeeper badge](https://badges.greenkeeper.io/opencollective/opencollective-frontend.svg)](https://greenkeeper.io/)
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/opencollective/localized.svg)](https://crowdin.com/project/opencollective)

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

This project requires an access to the Open Collective API.

By default, it will try to connect to the Open Colllective staging API, **you don't have to change anything**.

If case you want to connect to the Open Collective API running locally:

- clone, install and start [opencollective-api](https://github.com/opencollective/opencollective-api)
- in this project, copy [`.env.local`](.env.local) to `.env`.

### Start

```
npm run dev
```

## Contributing

Code style? Commit convention? Please check our [Contributing guidelines](CONTRIBUTING.md).

TL;DR: we use [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/), we do like great commit messages and clean Git history.

## Styleguide

We use [React-Styleguidist](https://react-styleguidist.js.org/) to develop and document our React components in isolation with [styled-components](https://www.styled-components.com/) and [styled-system](https://jxnblk.com/styled-system/).

### Start

```
npm run styleguide:dev
```

### Create a new component:

Only components with a matching example markdown file in the `styleguide/examples/` directory will appear in the styleguide. After creating a new component in the `src/components/` directory (i.e. `src/components/NewComponent.js`), make an example markdown file to go with it (i.e. `styleguide/examples/NewComponent.md`).

If you are creating a styled-component, you will need to annotate the export statement for React-Styleguidist to recognize it:

```es6
/** @component */
export default NewComponent;
```

Check out the [React-Styleguidist docs](https://react-styleguidist.js.org/docs/documenting.html) for more details about documenting components with [JSDoc](http://usejsdoc.org/) annotations and writing interactive code examples.

### Deploy

If you have access the Open Collective `now` team account:

```
npm run styleguide:deploy
```

## Tests

You can run the tests using `npm test` or more specifically:

- `npm run test:jest` for pages and components
- `npm run test:e2e` for end-to-end tests using [Cypress](https://www.cypress.io/)

To update:

- Jest snapshots: run `npm run test:update`
- GraphQL schema for eslint: run `npm run graphql:get-schema:dev`

## Localization

Translating the interface doesn't require any technical skill, you can go on
https://crowdin.com/project/opencollective and start translating right away!

We're currently looking for contributions for the following languages:

- French
- Spanish
- Japanese

Want to add a new language for Open Collective? [Contact us](https://slack.opencollective.org),
we'll be happy to help you to set it up!

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

## Discussion

If you have any questions, ping us on Slack
(https://slack.opencollective.org) or on Twitter
([@opencollect](https://twitter.com/opencollect)).
