#!/bin/bash
DB=wwcode_test
DUMPFILE=test/dbdumps/wwcode_test.pgsql
scripts/db_restore.sh $DB $DUMPFILE
PG_DATABASE=$DB npm run db:migrate:dev
pg_dump -O -F t $DB > $DUMPFILE 
echo "Done"
