#!/bin/bash
# This shell scripts copies the production database to the staging database
# Usage: npm run db:copyprodtostaging (from the root of the opencollective-api repo)
#
# The staging version of OpenCollective is on https://staging.opencollective.com
ENV="${1}"
PROD_PG_URL_ENVIRONMENT_VARIABLE=`heroku config:get PG_URL_ENVIRONMENT_VARIABLE -a opencollective-prod-api`
PROD_PG_URL_ENVIRONMENT_VARIABLE="${PROD_PG_URL_ENVIRONMENT_VARIABLE:-DATABASE_URL}"
STAGING_PG_URL_ENVIRONMENT_VARIABLE=`heroku config:get PG_URL_ENVIRONMENT_VARIABLE -a opencollective-staging-api`
STAGING_PG_URL_ENVIRONMENT_VARIABLE="${STAGING_PG_URL_ENVIRONMENT_VARIABLE:-DATABASE_URL}"
PROD_PG_URL=`heroku config:get ${PROD_PG_URL_ENVIRONMENT_VARIABLE} -a opencollective-prod-api`

echo "Copying prod to ${ENV}"

# See https://devcenter.heroku.com/articles/heroku-postgres-import-export
heroku pg:copy ${PROD_PG_URL} ${STAGING_PG_URL_ENVIRONMENT_VARIABLE} --app ${ENV} --confirm ${ENV}

echo ""

echo " All done"
echo ""
echo "${ENV} is now synced with the production database"
echo ""
echo "You may need to run a migration if the schema has changed"
echo "To do so, follow those steps:"
echo "$> heroku run bash -a ${ENV}"
echo "heroku> npm run db:migrate"
