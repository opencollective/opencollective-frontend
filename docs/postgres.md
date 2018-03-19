# Database

You need to have Postgres 9.x with the Postgis extension.

## Installation

### On macOS

Last time we checked, the simplest way to get this running was using [Postgres.app](http://postgresapp.com/).

Using brew was not an option:
 - `brew install postgresql postgis` would end up with Postgres 10.x
 - `brew install postgresql@9.x` would end up with Postgres 9.x without possibility to install Postgis

## Setting Up The database

Now, assuming the postgres database superuser is `postgres`:

```
createdb -U postgres opencollective_test
createdb -U postgres opencollective_dvl
createuser -U postgres opencollective
psql -U postgres -c 'GRANT ALL PRIVILEGES ON DATABASE opencollective_dvl TO opencollective'
psql -U postgres -c 'GRANT ALL PRIVILEGES ON DATABASE opencollective_test TO opencollective'
psql -U postgres -d opencollective_dvl -c 'CREATE EXTENSION postgis'
psql -U postgres -d opencollective_test -c 'CREATE EXTENSION postgis'
```

## Troubleshooting

For development, ensure that local connections do not require a password. Locate your `pg_hba.conf` file by running `SHOW hba_file;` from the psql prompt (`sudo -i -u postgres` + `psql` after clean install). This should look something like `/etc/postgresql/9.5/main/pg_hba.conf`. We'll call the parent directory of `pg_hba.conf` the `$POSTGRES_DATADIR`. `cd` to `$POSTGRES_DATADIR`, and edit `pg_hba.conf` to `trust` local socket connections and local IP connections. Restart `postgres` - on Mac OS X, there may be restart scripts already in place with `brew`, if not use `pg_ctl -D $POSTGRES_DATADIR restart`.

## FAQ

### error: type "geometry" does not exist

Make sure Postgis is available and activated.
