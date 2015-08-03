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
