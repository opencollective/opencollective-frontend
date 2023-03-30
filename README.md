# Open Collective Frontend

[![Dependency Status](https://david-dm.org/opencollective/opencollective-frontend/status.svg)](https://david-dm.org/opencollective/opencollective-frontend)
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/opencollective/localized.svg)](https://crowdin.com/project/opencollective)

<p align="center">
  <a href="https://github.com/opencollective/opencollective-frontend">
    <img width="838" src="https://user-images.githubusercontent.com/1556356/91951703-030aa180-ed01-11ea-8b1d-b3e4a0ca1fed.png" alt="Babel - Open Collective">
  </a>
</p>

## Foreword

If you see a step below that could be improved (or is outdated), please update the instructions. We rarely go through this process ourselves, so your fresh pair of eyes and your recent experience with it, makes you the best candidate to improve them for other users. Thank you!

## Development

### Prerequisite

1. Make sure you have Node.js version 18.x and NPM version 8.x.

- We recommend using [nvm](https://github.com/creationix/nvm): `nvm install && nvm use`.

### Install

We recommend cloning the repository in a folder dedicated to `opencollective` projects.

```
git clone git@github.com:opencollective/opencollective-frontend.git opencollective/frontend
cd opencollective/frontend
npm install
```

### Environment variables

This project requires an access to the Open Collective API.

By default, it will try to connect to the Open Collective staging API, **you don't have to change anything**.

In case you want to connect to the Open Collective API running locally:

- clone, install and start [opencollective-api](https://github.com/opencollective/opencollective-api)
- in this project, copy the following content to a `.env` file:

```
API_URL=http://localhost:3060
API_KEY=dvl-1510egmf4a23d80342403fb599qd
```

### Start

```
npm run dev
```

## Tests

To run the tests:

- for pages and components use `npm test`
- for end-to-end (e2e) tests using [Cypress](https://www.cypress.io/) see [our dedicated guide](docs/e2e.md).

To update:

- Jest snapshots: run `npm run test:update`
- Translation files: run `npm run langs:update`
- GraphQL schema for ESLint: run `npm run graphql:update`

## Styleguide

We use [Storybook](https://storybook.js.org/docs/react/get-started/introduction) to develop and document our React components in isolation with [styled-components](https://www.styled-components.com/) and [styled-system](https://styled-system.com/).

More info: [docs/styleguide.md](docs/styleguide.md)

## Localization

Translating the interface doesn't require any technical skill, you can go on
https://crowdin.com/project/opencollective and start translating right away!

We're currently looking for contributions for the following languages:

- French
- Spanish
- Japanese

Want to add a new language for Open Collective? [Contact us](https://slack.opencollective.org),
we'll be happy to help you to set it up!

## Contributing

Code style? Commit convention? Please check our [Contributing guidelines](CONTRIBUTING.md).

TL;DR: we use [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/), we do like great commit messages and clean Git history.

## Bounties

This repo is part of the Open Collective bounty program. Get paid to contribute to Open Source! The Open Collective engineering team is small and we're always looking for new contributors to our Open Source codebases. Our Bounty program is an opportunity to solve issues that could be neglected otherwise. Contributors who fix these issues will be rewarded financially. Please see our docs for more information: https://docs.opencollective.com/help/contributing/development/bounties

## Deployment

This project is currently deployed to staging and production with [Heroku](https://www.heroku.com/). To deploy, you need to be a core member of the Open Collective team.

More info: [docs/deployment.md](docs/deployment.md)

## Publishing components

To publish a frontend components update to [NPM](https://www.npmjs.com/package/@opencollective/frontend-components), you need to be a core member of the Open Collective team. Steps:

1. Check the currently published version with `npm view @opencollective/frontend-components version`
2. Trigger the publishing script by running `npm run publish-components {NEW_VERSION}`, where `{NEW_VERSION}` is the new version number (please follow [semver](https://semver.org/)).
3. Review the changes, and confirm if everything makes sense.

To add new files or dependencies to this exported package, have a look at [scripts/publish-components/config.ts](scripts/publish-components/config.ts).

## Discussion

If you have any questions, ping us on Slack
(https://slack.opencollective.com) or on Twitter
([@opencollect](https://twitter.com/opencollect)).

## Thanks

<a href="https://www.chromatic.com/"><img src="https://user-images.githubusercontent.com/321738/84662277-e3db4f80-af1b-11ea-88f5-91d67a5e59f6.png" width="153" height="30" alt="Chromatic" /></a>

Thanks to [Chromatic](https://www.chromatic.com/) for providing the visual testing platform that helps us review UI changes and catch visual regressions.
