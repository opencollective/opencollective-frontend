# OpenCollective API

[![Circle CI](https://circleci.com/gh/OpenCollective/opencollective-api/tree/master.svg?style=shield)](https://circleci.com/gh/OpenCollective/opencollective-api/tree/master)
[![Slack Status](https://slack.opencollective.com/badge.svg)](https://slack.opencollective.com)
[![Gitter chat](https://badges.gitter.im/OpenCollective/OpenCollective.svg)](https://gitter.im/OpenCollective/OpenCollective)
[![Dependency Status](https://david-dm.org/opencollective/opencollective-api.svg)](https://david-dm.org/opencollective/opencollective-api)
[![Coverage Status](https://coveralls.io/repos/github/OpenCollective/opencollective-api/badge.svg)](https://coveralls.io/github/OpenCollective/opencollective-api)

## How to get started

Note: If you see a step below that could be improved (or is outdated), please update instructions. We rarely go through this process ourselves, so your fresh pair of eyes and your recent experience with it, makes you the best candidate to improve them for other users.

### Database

Install Postgres 9.x. Start the database server, if necessary. If you face any issue with this step, see [troubleshooting postgres](docs/postgres.md)

### Node and npm

```
$> npm install
```

This will create the `opencollective_dvl` database if it doesn't exist yet (in which case it will just attempts to run the latest migration if any).
This sanitized version of the database includes the data for a very small subset of collectives:
- /opensource
- /apex
- /railsgirlsatl
- /tipbox
- /brusselstogether
- /veganizerbxl

You can test that the API is working by opening:
http://localhost:3060/status

And you can play with GraphQL by opening:
http://localhost:3060/graphql

For example, try this query:

```
query {
  Collective(slug:"apex") {
      id,
      slug,
      name,
      description,
      tiers {
        id,
        name,
        description,
        amount,
        currency,
        maxQuantity
      }
      members{
        id
        role
        member {
          id
          slug
          name
        }
        stats {
          totalDonations
        }
      }
    }
}
```

## Tests

```
$> npm test
```

The tests delete all the `opencollective_test` database's tables and re-create them with the latest models.

All the calls to 3rd party services are stubbed using either `sinon` or `nock`.

If you get an error at the first test, you might have forgotten to run postgres. Use e.g. the following aliases to start/stop postgres:
```
export PGDATA='/usr/local/var/postgres'
alias pgstart='pg_ctl -l $PGDATA/server.log start'
alias pgstop='pg_ctl stop -m fast'
```

See [Wiki](https://github.com/OpenCollective/OpenCollective/wiki/Software-testing) for more info about the tests.

## Start server

In development environment: 

```
npm run dev
```

This will watch for file changes and automatically restart the server

On production:

```
npm run start
```

## Documentation
WIP. Help welcome!

## Questions

If you have any questions, ping us on Slack (https://slack.opencollective.org) or on Twitter ([@opencollect](https://twitter.com/opencollect)).

## TODO

- The User model is confusing with the concept of User Collective, we should merge the "User" model with the "ConnectedAccount" model so that we could have multiple emails per User.
- CreatedByUserId is confusing, it should be "CreatedByCollectiveId"
