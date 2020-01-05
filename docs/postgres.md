# PostgreSQL Database

You need to have PostgreSQL 9.x, 10.x or 11.x with the Postgis extension.

In production, we're currently running 9.6.11.

## Installation

### On macOS

#### With Homebrew

`brew install postgresql postgis`

#### With Postgres.app

Get the app from [Postgres.app](http://postgresapp.com/). Install it.

Then to enable the CLI tools, follow the steps from: https://postgresapp.com/documentation/cli-tools.html

### With Docker

If you don't want to run a local instance of PostgreSQL in your computer, you can run one in Docker.

Create and run the container:

```
docker run -p 5432:5432 -d --name opencollective-postgres mdillon/postgis:9.6
```

Set the necessary environment variables:

```
export PGHOST=localhost
export PGUSER=postgres
```

You'll also need to have Postgres client tools like `psql`, `dropdb`, `createuser` locally available to run our scripts. In macOS you can install those using Homebrew with:

```
brew install libpq
echo 'export PATH="/usr/local/opt/libpq/bin:$PATH"' >> ~/.bash_profile
```

## Setup

#### Development

Please be aware of the `NODE_ENV` variable. By default, it's set to `development` and the `opencollective_dvl` database will be used.

The development database should be automatically installed after `npm install`.

To trigger the postinstall script again, run `npm run postinstall`.

To force a restore run `npm run db:restore`, then `npm run db:migrate`.

#### Test

Please be aware of the `NODE_ENV` variable. By default, it's set to `development` and the `opencollective_dvl` database will be used. You have to set it yourself to `test` to switch to the test environment and use `opencollective_test` instead.

To setup the database for tests, run `npm run db:setup` or run `NODE_ENV=test npm run db:setup` to force the environment.

If you want to do the steps manually, first, make sure the `opencollective` user is existing:

`createuser opencollective`

Then:

```
createdb opencollective_test
psql -d opencollective_test -c 'GRANT ALL PRIVILEGES ON DATABASE opencollective_test TO opencollective'
psql -d opencollective_test -c 'CREATE EXTENSION postgis'
```

## Reset

Sometime, things dont't work as expected and you need to start from scratch. Do:

```
dropdb opencollective_dvl
dropdb opencollective_test
dropuser opencollective
```

## Troubleshooting

For development, ensure that local connections do not require a password. Locate your `pg_hba.conf` file by running `SHOW hba_file;` from the psql prompt (`sudo -i -u postgres` + `psql` after clean install). This should look something like `/etc/postgresql/9.5/main/pg_hba.conf`. We'll call the parent directory of `pg_hba.conf` the `$POSTGRES_DATADIR`. `cd` to `$POSTGRES_DATADIR`, and edit `pg_hba.conf` to `trust` local socket connections and local IP connections. Restart `postgres` - on Mac OS X, there may be restart scripts already in place with `brew`, if not use `pg_ctl -D $POSTGRES_DATADIR restart`.

## FAQ

### error: type "geometry" does not exist

Make sure Postgis is available and activated.

### Unhandled rejection error: permission denied to create extension "postgis"

Follow the **Reset** steps and try again.
