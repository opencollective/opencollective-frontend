# Deployment

To deploy to staging or production, you need to be a core member of the Open Collective team.

## Install the Heroku CLI

`npm install -g heroku`

## Login on the Heroku CLI

`heroku login`

## (Optional) Configure Slack Deployment Webhook

Setting a Slack webhook will post a message on `#deployments` channel with the changes you're about to deploy. It is not required, but you can activate it as folows.

Contact another [core team member](https://github.com/orgs/opencollective/teams/core-developers) to ask them for the link or, if you have admins permission on it, go to https://api.slack.com/apps/A017TDR2R61/incoming-webhooks and copy the link for `#deployments` channel.

Finally add this link to your `.env` file:

```bash
OC_SLACK_DEPLOY_WEBHOOK=<link-url>
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
