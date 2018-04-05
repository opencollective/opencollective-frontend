#!/bin/sh
#
# This script will wait for postgres to be up and running so the
# application won't ever try to run without a database server.
#
# After making sure the database is accessible *and* ready to receive
# commands, this script will execute whatever command was passed to
# the command line. Here's an example:
#
#  $ ./docker/wait-for-db.sh npm run dev
#
# Important detail: This script assumes the database server is hosted
# on the address `postgres`, which is the name of the container
# service for the database in our docker setup.

echo 'Waiting for the database to come up'
until pg_isready -h postgres; do
    echo "DB is unavailable - sleeping"
    sleep 1
done

echo "Run application command: $@"
exec $@
