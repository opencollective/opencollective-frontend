# Deployment

To deploy to staging or production, you need to be a core member of the Open Collective team.

## Install the Heroku CLI

`npm install -g heroku`

## Login on the Heroku CLI

`heroku login`

## (Optional) Configure Slack token

Setting a Slack token will post a message on `#engineering` with the changes you're
about to deploy. It is not required, but you can activate it like this:

1. Go to https://api.slack.com/custom-integrations/legacy-tokens
2. Generate a token for the OpenCollective workspace
3. Add this token to your `.env` file:

```bash
OC_SLACK_DEPLOY_WEBHOOK=https://hooks.slack.com/services/....
```

## Staging (heroku)

```bash
# Before first deployment, configure staging remote
git remote add staging https://git.heroku.com/oc-staging-frontend.git

# Then deploy main with
npm run deploy:staging
```

URL: https://staging.opencollective.com/

## Production (heroku)

```bash
# Before first deployment, configure production remote
git remote add production https://git.heroku.com/oc-prod-frontend.git

# Then deploy main with
npm run deploy:production
```

URL: https://opencollective.com/
