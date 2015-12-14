#!/bin/bash
# This shell scripts copies the production database to the local database
# Usage: npm run db:copyprod (from the root of the opencollective-api repo)
#
# To run the API with the local version of the production database, run:
# PG_DATABASE=opencollective_prod_snapshot npm start

LOCALDBUSER="opencollective"
LOCALDBNAME="opencollective_prod_snapshot"
PG_URL=`heroku config:get PG_URL -a opencollective-prod-api`
DBDUMPS_DIR="dbdumps/"

FILENAME=`date +"%Y-%m-%d"`-prod.pgsql

if [ ! -d $DBDUMPS_DIR ]; then
  mkdir $DBDUMPS_DIR
fi

if ! psql ${LOCALDBNAME} -c '\q' 2>&1; then
  echo "Creating $LOCALDBNAME"
  psql -c "CREATE DATABASE $LOCALDBNAME"
fi


if [ ! -f "$DBDUMPS_DIR$FILENAME" ]; then
  echo "Dumping $PG_URL"
  pg_dump -O -F t $PG_URL > $DBDUMPS_DIR$FILENAME
fi

echo "DB dump saved in $DBDUMPS_DIR$FILENAME"

# The first time we run it, we will trigger FK constraints errors
pg_restore -n public -O -c -d $LOCALDBNAME $DBDUMPS_DIR$FILENAME 2>/dev/null

# So we run it twice :-)
pg_restore -n public -O -c -d $LOCALDBNAME $DBDUMPS_DIR$FILENAME

echo "DB restored to postgres://localhost/$LOCALDBNAME"

# We make sure the user $LOCALDBUSER has access
psql $LOCALDBNAME -c "CREATE ROLE $LOCALDBUSER WITH login;"

# Change ownership of all tables
tables=`psql -qAt -c "select tablename from pg_tables where schemaname = 'public';" $LOCALDBNAME`

for tbl in $tables ; do
  psql $LOCALDBNAME -c "alter table \"$tbl\" owner to $LOCALDBUSER";
done

# Change ownership of the database
psql $LOCALDBNAME -c "alter database $LOCALDBNAME owner to $LOCALDBUSER;"

psql $LOCALDBNAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $LOCALDBUSER;"

# Insert the local development api_key
psql $LOCALDBNAME -c "INSERT INTO \"Applications\" (api_key, name) VALUES ('0ac43519edcf4421d80342403fb5985d','opencollective-mobileapp-dev');"
