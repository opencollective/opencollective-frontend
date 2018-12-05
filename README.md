# OpenCollective API

[![Circle CI](https://circleci.com/gh/opencollective/opencollective-api/tree/master.svg?style=shield)](https://circleci.com/gh/opencollective/opencollective-api/tree/master)
[![Slack Status](https://slack.opencollective.org/badge.svg)](https://slack.opencollective.org)
[![Dependency Status](https://david-dm.org/opencollective/opencollective-api.svg)](https://david-dm.org/opencollective/opencollective-api)
[![Coverage Status](https://coveralls.io/repos/github/OpenCollective/opencollective-api/badge.svg)](https://coveralls.io/github/OpenCollective/opencollective-api)

## Foreword

If you see a step below that could be improved (or is outdated), please update the instructions. We rarely go through this process ourselves, so your fresh pair of eyes and your recent experience with it, makes you the best candidate to improve them for other users. Thank you!

## Development

### Prerequisite

1. Make sure you have Node.js version >= 10.

- We recommend using [nvm](https://github.com/creationix/nvm): `nvm use`.

2. Make sure you have a PostgreSQL database available

- Check the version: 10.3, 9.6.8, 9.5.12, 9.4.17, 9.3.22 or newer
- Check that the [PostGIS](https://postgis.net/install/) extension is available

3. For [node-gyp](https://github.com/nodejs/node-gyp), make sure you have Python 2 available and configured as the active version. You can use [pyenv](https://github.com/pyenv/pyenv) to manage Python versions.

### Install

We recommend cloning the repository in a folder dedicated to `opencollective` projects.

```
git clone git@github.com:opencollective/opencollective-api.git opencollective/api
cd opencollective/api
npm install
```

### Start

```
npm run dev
```

#### Troubleshooting

- If you're running into `node-gyp` issues related to Python 3 vs Python 2, you can run:
  `npm rebuild`
- The `postinstall` script should bootstrap the database along with some seed data. If it failed, you can try again with:
  `npm run db:setup && npx babel-node ./scripts/db_restore.js opencollective_dvl`

#### Local Email

Email templates can be viewed locally by running `npm run compile:email <template name>` and making sure there is data for that template in `scripts/compile-email.js`.

Email sending can done by running [`npm run maildev`](https://danfarrelly.nyc/MailDev/) locally and setting the `MAILDEV` environment variable to `true`. Then open `http://localhost:1080` to see any outgoing emails from the `opencollective-api` server.

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
npm run deploy:staging
```

URL: https://api-staging.opencollective.com/

### Production (heroku)

```bash
npm run deploy:production
```

URL: https://api.opencollective.com/

## More documentation:

- [List of supported environment variables](docs/environment_variables.md)

## Discussion

If you have any questions, ping us on Slack
(https://slack.opencollective.org) or on Twitter
([@opencollect](https://twitter.com/opencollect)).
