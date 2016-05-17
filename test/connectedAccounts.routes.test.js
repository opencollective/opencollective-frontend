const app = require('../index');
const request = require('supertest');
const utils = require('./utils')();
const expect = require('chai').expect;

const models = app.set('models');

describe('connectedAccounts.routes.test.js: GIVEN an application and group', () => {

  beforeEach(done => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  describe('WHEN calling /connected-accounts/github', () => {

    beforeEach(done => {
      req = request(app)
        .post('/connected-accounts/github');
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
          .post(`/connected-accounts/${row.service}`)
          .send({
            api_key: application.api_key,
            accessToken: 'blah'
          });
        done();
      });

      it(`THEN returns ${row.status}`, done => req.expect(row.status).end(done));
    });
  });

  describe('WHEN calling /connected-accounts/github/verify', () => {

    // Create user.
    beforeEach((done) => {
      models.User.create(utils.data('user1')).done((e, u) => {
        expect(e).to.not.exist;
        user = u;
        done();
      });
    });

    beforeEach(done => {
      req = request(app)
        .get('/connected-accounts/github/verify');
      done();
    });

    describe('WHEN calling without API key', () => {
      beforeEach(done => {
        req = req.set('Authorization', 'Bearer ' + user.jwt(application, {
          scope: ''
        }))
        done();
      });

      it('THEN returns 400', done => req.expect(400).end(done));
    });

    describe('WHEN providing API key but no token', () => {
      beforeEach(done => {
        req = req.send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 401 Unauthorized', done => req.expect(401).end(done));
    });

    describe('WHEN providing API key and token but no username', () => {
      beforeEach(done => {
        req = req
              .set('Authorization', 'Bearer ' + user.jwt(application, { scope: 'github'}))
              .send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 400', done => req.expect(400).end(done));
    });

    describe('WHEN providing API key, token and scope', () => {
      beforeEach(done => {
        req = req
              .set('Authorization', 'Bearer ' + user.jwt(application, { scope: 'github', username: 'asood123', connectedAccountId: 1}))
              .send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 200 OK', done => {
        req.expect(200)
          .end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body.provider).to.be.equal('github');
            expect(res.body.username).to.be.equal('asood123');
            expect(res.body.connectedAccountId).to.be.equal(1);
            done();
        });
      });
    });
  });

});
