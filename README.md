# opencollective-api
OpenCollective's API

## How to get started

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
`npm test`
All the calls to 3rd party services are stubbed using either `sinon` or `nock`.

## Start server
`npm run start`

## Reset db with fixtures

Run the server on the side:
`npm run start`

Run the script afterwards:
`npm run db:reset`

You can now login on development with `ops@opencollective.com` and `password`.
You can auth to the paypal sandbox with `ops@opencollective.com` and `paypal123`.

Feel free to modify `scripts/create_user_and_group.js` to create your own user/group.

## Documentation
http://docs.opencollective.apiary.io/

## Deployment

If you want to deploy the app on Heroku, you need to add the remotes:

```
git remote add heroku-staging https://git.heroku.com/opencollective-staging-api.git
git remote add heroku-production https://git.heroku.com/opencollective-prod-api.git
```

Then you can run:

```
git push heroku-staging master
git push heroku-staging branch:master
```

## Databases migrations

The tests delete all the `opencollective_test` database's tables and re-create them with the latest models.

For localhost or other environments, the migrations has to be run manually.

### Create a new migration file

`sequelize migration:create`

### Apply migrations locally

`SEQUELIZE_ENV=development npm run db:migrate`

### Apply migrations on Heroku

The migration script uses `SEQUELIZE_ENV` to know which Postgres config to take (check `sequelize_cli.json`). On staging and production, it will use `PG_URL`.

1) Push application with migration scripts to Heroku

2) `heroku run bash -a opencollective-staging-api`

3) `npm run db:migrate`

