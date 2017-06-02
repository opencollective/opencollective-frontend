#!/bin/bash

usage() {
  echo "Usage: db_restore.sh LOCALDBNAME DBDUMP_FILE";
  echo "e.g.";
  echo "> db_restore.sh wwcode_test opencollective-api/test/dbdumps/wwcode_test.pgsql"
  exit 0;
}

if [ "$#" -ne 2 ]; then usage; fi;

LOCALDBNAME=$1
DBDUMP_FILE=$2
LOCALDBUSER="opencollective"

# The first time we run it, we will trigger FK constraints errors
set +e
pg_restore --no-acl -n public -O -c -d "${LOCALDBNAME}" "${DBDUMP_FILE}" 2>/dev/null
set -e

# So we run it twice :-)
pg_restore --no-acl -n public -O -c -d "${LOCALDBNAME}" "${DBDUMP_FILE}"

echo "DB restored to postgres://localhost/${LOCALDBNAME}"

# cool trick: all stdout ignored in this block
{
  set +e
  # We make sure the user $LOCALDBUSER has access; could fail
  psql "${LOCALDBNAME}" -c "CREATE ROLE ${LOCALDBUSER} WITH login;" 2>/dev/null
  set -e

  # Change ownership of all tables
  tables=`psql -qAt -c "select tablename from pg_tables where schemaname = 'public';" "${LOCALDBNAME}"`

  for tbl in $tables ; do
    psql "${LOCALDBNAME}" -c "alter table \"${tbl}\" owner to ${LOCALDBUSER};"
  done

  # Change ownership of the database
  psql "${LOCALDBNAME}" -c "alter database ${LOCALDBNAME} owner to ${LOCALDBUSER};"

  psql "${LOCALDBNAME}" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${LOCALDBUSER};"

} | tee >/dev/null
