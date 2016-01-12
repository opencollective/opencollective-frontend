#!/bin/bash
# This shell scripts copies the production database to the staging database
# Usage: npm run db:copyprodtostaging (from the root of the opencollective-api repo)
#
# The staging version of OpenCollective is on https://staging.opencollective.com

PROD_PG_URL=`heroku config:get PG_URL -a opencollective-prod-api`

# See https://devcenter.heroku.com/articles/heroku-postgres-import-export
heroku pg:copy $PROD_PG_URL DATABASE_URL --app opencollective-staging-api --confirm opencollective-staging-api

echo ""

echo " All done"
echo ""
echo "https://staging.opencollective.com is now synced with the production database"
echo ""
echo "You may need to run a migration if the schema has changed"
echo "To do so, follow those steps:"
echo "$> heroku run bash -a opencollective-staging-api"
echo "heroku> npm run db:migrate"
