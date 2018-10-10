#!/usr/bin/env bash

set -e

# Only run migrations automatically on staging and production
if [ "$SEQUELIZE_ENV" = "staging" ] || [ "$SEQUELIZE_ENV" = "production" ]; then
  echo "- running db:migrate on $SEQUELIZE_ENV environment"
  npm run db:migrate
  exit $?; # exit with return code of previous command
fi

# On any other environment, first let's check if postgres is installed
if command -v psql > /dev/null; then
  echo "✓ Postgres installed"
else
  echo "𐄂 psql command doesn't exist. Make sure you have Postgres installed ($> brew install postgres)"
fi

# On circleci environment
if [ "$NODE_ENV" = "circleci" ]; then
  echo "- setup db user and run migration if any"
  npm run db:setup
  npm run db:migrate
else
  if psql -lqt | cut -d \| -f 1 | grep -qw opencollective_dvl; then
    echo "✓ opencollective_dvl exists"
  else
    echo "- restoring opencollective_dvl";
    ./scripts/db_restore.sh -d opencollective_dvl -f test/dbdumps/opencollective_dvl.pgsql
  fi
  echo "- running migration if any"
  PG_DATABASE=opencollective_dvl npm run db:migrate:dev
fi

echo ""
echo "You can now start the open collective api server by running:"
echo "$> npm run dev"
echo ""
