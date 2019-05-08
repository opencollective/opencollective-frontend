# Deployment

To deploy to staging or production, you need to be a core member of the Open Collective team.

## (Optional) Configure Slack token

Setting a Slack token will post a message on `#engineering` with the changes you're
about to deploy. It is not required, but you can activate it like this:

1. Go to https://api.slack.com/custom-integrations/legacy-tokens
2. Generate a token for the OpenCollective workspace
3. Add this token to your `.env` file:

```bash
OC_SLACK_USER_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Staging (heroku)

```bash
npm run deploy:staging
```

URL: https://api-staging.opencollective.com/

## Production (heroku)

```bash
npm run deploy:production
```

URL: https://api.opencollective.com/
