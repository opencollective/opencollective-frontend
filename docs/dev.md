# Development

## Node and npm

You can test that the API is working by opening:
http://localhost:3060/status

And you can play with GraphQL by opening:
http://localhost:3060/graphql?api_key=dvl-1510egmf4a23d80342403fb599qd

![](http://d.pr/i/Vxm1rw+)

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

The tests delete all the `opencollective_test` database's tables and
re-create them with the latest models.

All the calls to 3rd party services are stubbed using either `sinon`
or `nock`.

If you get an error at the first test, you might have forgotten to run
postgres. Use e.g. the following aliases to start/stop postgres:

```
export PGDATA='/usr/local/var/postgres'
alias pgstart='pg_ctl -l $PGDATA/server.log start'
alias pgstop='pg_ctl stop -m fast'
```

See
[Wiki](https://github.com/OpenCollective/OpenCollective/wiki/Software-testing)
for more info about the tests.

## Running Scripts

There are many admin scripts in [`/scripts` directory](https://github.com/opencollective/opencollective-api/tree/master/scripts). To run them:

```
# Local development (without Docker)
$ npx babel-node ./scripts/populate_usernames.js
```
