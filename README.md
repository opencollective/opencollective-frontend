# OpenCollective API

[![Circle CI](https://circleci.com/gh/OpenCollective/opencollective-api/tree/master.svg?style=shield)](https://circleci.com/gh/OpenCollective/opencollective-api/tree/master)
[![Slack Status](https://slack.opencollective.com/badge.svg)](https://slack.opencollective.com)
[![Gitter chat](https://badges.gitter.im/OpenCollective/OpenCollective.svg)](https://gitter.im/OpenCollective/OpenCollective)
[![Dependency Status](https://david-dm.org/opencollective/opencollective-api.svg)](https://david-dm.org/opencollective/opencollective-api)

## How to get started

Note: If you see a step below that could be improved (or is outdated), please update instructions. We rarely go through this process ourselves, so your fresh pair of eyes and your recent experience with it, makes you the best candidate to improve them for other users. 

### Database
Install Postgres 9.x. Start the database server, if necessary.

For development, ensure that local connections do not require a password. Locate your `pg_hba.conf` file by
running `ps aux | grep postgres` and note the directory in the `postgres` or `postmaster` process, specified with `-D`.
It will look something like `/Library/PostgreSQL/9.3/data`. We'll call this the `$POSTGRES_DATADIR`. `cd` to `$POSTGRES_DATADIR`, and
edit `pg_hba.conf` to `trust` local socket connections and local IP connections. Restart `postgres` - on Mac OS X, there may be
restart scripts already in place with `brew`, if not use `pg_ctl -D $POSTGRES_DATADIR restart`.

Now, assuming the postgres database superuser is `postgres`, let's create the databases.
```
createdb -U postgres opencollective_localhost
createdb -U postgres opencollective_test
createuser -U postgres opencollective
psql -U postgres
> GRANT ALL PRIVILEGES ON DATABASE opencollective_localhost TO opencollective;
> GRANT ALL PRIVILEGES ON DATABASE opencollective_test TO opencollective;
```

### Configuration and secrets
- From the OpenCollective DropBox: `cp $DROPBOX/Engineering/config/DOTenv .env`
- There are other config files there, but for now they seem to be duplicated in `config`

### Node and npm

`npm install`

If you haven't already: `export PATH=./node_modules/bin:$PATH`. You probably want to add
that to your shell profile.


## Tests

See [Wiki](https://github.com/OpenCollective/OpenCollective/wiki/Software-testing).

All the calls to 3rd party services are stubbed using either `sinon` or `nock`.

If you get an error at the first test, you might have forgotten to run postgres. Use e.g. the following aliases to start/stop postgres:
```
export PGDATA='/usr/local/var/postgres'
alias pgstart='pg_ctl -l $PGDATA/server.log start'
alias pgstop='pg_ctl stop -m fast'
```

## Start server
`npm run start`

## Reset db with fixtures

Run the server on the side (in parallel because the reset scripts hits directly the api):
`DEBUG=email npm run dev`

Run the script afterwards:
`npm run db:reset`

You can now login on development (website repo) with `user@opencollective.com` and the token will show up in your console.
You can auth to the paypal sandbox with `ops@opencollective.com` and `paypal123`.

Feel free to modify `scripts/create_user_and_group.js` to create your own user/group.

## Documentation
http://docs.opencollective.apiary.io/

## Deployment

If you want to deploy to staging, you need to push your code to the `staging` branch. CircleCI will run the tests on this branch and push to Heroku for you if successful.

### Manually

If you want to deploy the app on Heroku manually (only for production), you need to add the remotes:

```
git remote add heroku-production https://git.heroku.com/opencollective-prod-api.git
```

Then you can run:

```
git push heroku-production master
```

## Databases migrations

The tests delete all the `opencollective_test` database's tables and re-create them with the latest models.

For localhost or other environments, the migrations has to be run manually.

### Create a new migration file

`npm run migration:create`

### Apply migrations locally

`npm run db:migrate:dev`

### Apply migrations on Heroku

The migrations are run automatically for `staging`.

The migration script uses `SEQUELIZE_ENV` to know which Postgres config to take (check `sequelize_cli.json`). On staging and production, it will use `PG_URL`. We don't use `NODE_ENV` because heroku overrides the variable during the build process.

1) Push application with migration scripts to Heroku

2) `heroku run bash -a opencollective-production-api`

3) `npm run db:migrate`

