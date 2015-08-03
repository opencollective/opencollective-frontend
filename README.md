# opencollective-api
OpenCollective's API

## Prerequisite
- Install PostGres
- Create 2 databases: `opencollective_localhost` and `opencollective_test`

## Install
`npm install`

## Tests
`npm test`
All the calls to 3th party services are stubbed using either `sinon` or `nock`.

## Start server
`npm run start`

## Documentation
http://docs.opencollective.apiary.io/

## Databases migrations
The tests delete all the database's tables and re-create them with the latest models.

For localhost or other environments, the migrations has to be run manually.

### Create a new migration file
`sequelize migration:create`

### Apply migrations locally
`sequelize db:migrate --config config/default.json --models-path app/models`

### Apply migrations on other environments
Here for preview:
`sequelize db:migrate --config config/default.json --models-path app/models --env preview`

### Undo a migration
`sequelize db:migrate:undo --config config/default.json --models-path app/models`
