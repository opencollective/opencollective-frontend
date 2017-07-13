#!/bin/bash
# This scripts migrates the schema of the wwcode_test db (with sanitized data)
# And updates the dump export for tests in test/dbdumps/wwcode_test.pgsql

PG_DATABASE=wwcode_test
DUMPFILE="test/dbdumps/$PG_DATABASE.pgsql"
./scripts/db_restore.sh -d $PG_DATABASE -U opencollective -f $DUMPFILE
echo "Migrating $PG_DATABASE"
PG_DATABASE=$PG_DATABASE npm run db:migrate:dev
pg_dump -O -F t $PG_DATABASE > $DUMPFILE
echo "$DUMPFILE migrated. Please commit it and push it."
echo ""
