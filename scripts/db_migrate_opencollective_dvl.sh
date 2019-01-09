#!/bin/bash
# This scripts migrates the schema of the opencollective_dvl db (with sanitized data)
# And updates the dump export for tests in test/dbdumps/opencollective_dvl.pgsql

PG_DATABASE=opencollective_dvl
DUMPFILE="test/dbdumps/$PG_DATABASE.pgsql"
./scripts/db_restore.sh -d $PG_DATABASE -U opencollective -f $DUMPFILE
echo "Migrating $PG_DATABASE"
DEBUG=psql PG_DATABASE=$PG_DATABASE npm run db:migrate
PG_DATABASE=$PG_DATABASE npm run db:sanitize
pg_dump -O -F t $PG_DATABASE > $DUMPFILE
echo "$DUMPFILE migrated. Please commit it and push it."
echo ""
