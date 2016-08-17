const app = require('../index');
const config = require('config');
const request = require('supertest');
const utils = require('./utils')();
const expect = require('chai').expect;
const jwt = require('jsonwebtoken');

const models = app.set('models');
const clientId = config.github.clientID;

describe('connectedAccounts.routes.test.js: GIVEN an application and group', () => {

  var application, req, user;

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  describe('WHEN calling /connected-accounts/github', () => {

    beforeEach(done => {
      req = request(app)
        .get('/connected-accounts/github');
      done();
    });

    describe('WHEN calling without API key', () => {

      it('THEN returns 400', done => req.expect(400).end(done));
    });

    describe('WHEN calling /connected-accounts/github with API key', () => {

      beforeEach(done => {
        req = request(app)
          .get(`/connected-accounts/github?utm_source=mm`)
          .send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 302 with location', done => {
        req.expect(302)
          .end((err, res) => {
            expect(err).not.to.exist;
            const baseUrl = 'https://github.com/login/oauth/authorize';
            const redirectUri = encodeURIComponent(`${config.host.website}/api/connected-accounts/github/callback?utm_source=mm&slug=`);
            const scope = encodeURIComponent('user:email,public_repo');
            const location = `^${baseUrl}\\?response_type=code&redirect_uri=${redirectUri}&scope=${scope}&client_id=${clientId}$`;
            expect(res.headers.location).to.match(new RegExp(location));
            done();
          });
      });
    });
  });

  describe('WHEN calling /connected-accounts/github/callback', () => {

    beforeEach(done => {
      req = request(app)
        .get('/connected-accounts/github/callback');
      done();
    });
    describe('WHEN calling without API key', () => {
      it('THEN returns 400', done => req.expect(400).end(done));
    });

    describe('WHEN calling with invalid API key', () => {
      beforeEach(done => {
        req = req.send({ api_key: 'bla' });
        done();
      });

      it('THEN returns 401', done => req.expect(401).end(done));
    });

    describe('WHEN calling with valid API key', () => {
      beforeEach(done => {
        req = req.send({api_key: application.api_key});
        done();
      });

      it('THEN returns 302 with location', done => {
        req.expect(302)
          .end((err, res) => {
            expect(err).not.to.exist;
            expect(res.headers.location).to.be.equal(`https://github.com/login/oauth/authorize?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fconnected-accounts%2Fgithub%2Fcallback%3Futm_source%3D%26slug%3D&client_id=${clientId}`);
            done();
          });
      });
    });
  });

  describe('WHEN calling /connected-accounts/github/verify', () => {

    // Create user.
    beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

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
              .set('Authorization', `Bearer ${user.jwt(application, { scope: 'connected-account', username: 'asood123', connectedAccountId: 1})}`)
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
