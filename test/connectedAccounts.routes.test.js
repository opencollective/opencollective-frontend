const app = require('../index');
const request = require('supertest');
const utils = require('./utils')();

const models = app.set('models');

describe('connectedAccounts.routes.test.js: GIVEN an application and group', () => {

  beforeEach(done => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  beforeEach(done =>
    models.Group.create(utils.data('group1'))
      .then(props => group = props.dataValues)
      .then(() => done()));

  describe('WHEN calling /connected-accounts/github', () => {

    beforeEach(done => {
      req = request(app)
        .post('/groups/' + group.slug + '/connected-accounts/github');
      done();
    });

    describe('WHEN calling without API key', () => {
      beforeEach(done => {
        req = req.send({ accessToken: 'blah' });
        done();
      });

      it('THEN returns 400', done => req.expect(400).end(done));
    });

    describe('WHEN providing API key but no token', () => {
      beforeEach(done => {
        req = req.send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 400', done => req.expect(400).end(done));
    });
  });

  [
    { service: 'github', status: 200 },
    { service: 'twitter', status: 200 },
    { service: 'blah', status: 400 }
  ]
    .forEach(row => {

    describe(`WHEN calling /connected-accounts/${row.service} with API key and token`, () => {

      beforeEach(done => {
        req = request(app)
          .post('/groups/' + group.slug + `/connected-accounts/${row.service}`)
          .send({
            api_key: application.api_key,
            accessToken: 'blah'
          });
        done();
      });

      it(`THEN returns ${row.status}`, done => req.expect(row.status).end(done));
    });
  });
});
