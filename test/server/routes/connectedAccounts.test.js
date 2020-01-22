import app from '../../../server/index';
import config from 'config';
import request from 'supertest';
import * as utils from '../../utils';
import { expect } from 'chai';
import models from '../../../server/models';

const clientId = config.github.clientID;
const application = utils.data('application');

describe('server/routes/connectedAccounts', () => {
  let req, user;

  beforeEach(() => utils.resetTestDB());

  describe('WHEN calling /connected-accounts/github', () => {
    beforeEach(done => {
      req = request(app).get('/connected-accounts/github');
      done();
    });

    describe('WHEN calling /connected-accounts/github with API key', () => {
      beforeEach(done => {
        req = request(app)
          .get('/connected-accounts/github?utm_source=mm')
          .send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 302 with location', done => {
        req.expect(302).end((err, res) => {
          expect(err).not.to.exist;
          const baseUrl = 'https://github.com/login/oauth/authorize';
          const redirectUri = encodeURIComponent(
            `${config.host.website}/api/connected-accounts/github/callback?utm_source=mm`,
          );
          const scope = encodeURIComponent('user:email,public_repo,read:org');
          const location = `^${baseUrl}\\?response_type=code&redirect_uri=${redirectUri}&scope=${scope}&client_id=${clientId}$`;
          expect(res.headers.location).to.match(new RegExp(location));
          done();
        });
      });
    });
  });

  describe('WHEN calling /connected-accounts/github/callback', () => {
    beforeEach(done => {
      req = request(app).get('/connected-accounts/github/callback');
      done();
    });

    describe('WHEN calling with invalid API key', () => {
      beforeEach(done => {
        req = req.send({ api_key: 'bla' });
        done();
      });

      it('THEN returns 401', () => req.expect(401));
    });

    describe('WHEN calling with valid API key', () => {
      beforeEach(done => {
        req = req.send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 302 with location', done => {
        req.expect(302).end((err, res) => {
          expect(err).not.to.exist;
          expect(res.headers.location).to.be.equal(
            `https://github.com/login/oauth/authorize?response_type=code&redirect_uri=${encodeURIComponent(
              `${config.host.website}/api/connected-accounts/github/callback`,
            )}%3F&client_id=${clientId}`,
          );
          done();
        });
      });
    });
  });

  describe('WHEN calling /connected-accounts/github/verify', () => {
    // Create user.
    beforeEach(() => models.User.create(utils.data('user1')).tap(u => (user = u)));

    beforeEach(done => {
      req = request(app).get('/connected-accounts/github/verify');
      done();
    });

    describe('WHEN calling without API key', () => {
      beforeEach(done => {
        const token = user.jwt({ scope: '' });
        req = req.set('Authorization', `Bearer ${token}`);
        done();
      });

      it('THEN returns 400', () => req.expect(400));
    });

    describe('WHEN providing API key but no token', () => {
      beforeEach(done => {
        req = req.send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 401 Unauthorized', () => req.expect(401));
    });

    describe('WHEN providing API key and token but no username', () => {
      beforeEach(done => {
        req = req
          .set('Authorization', `Bearer ${user.jwt({ scope: 'github' })}`)
          .send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 400', () => req.expect(400));
    });

    describe('WHEN providing API key, token and scope', () => {
      beforeEach(done => {
        req = req
          .set(
            'Authorization',
            `Bearer ${user.jwt({
              scope: 'connected-account',
              username: 'asood123',
              connectedAccountId: 1,
            })}`,
          )
          .send({ api_key: application.api_key });
        done();
      });

      it('THEN returns 200 OK', done => {
        req.expect(200).end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.service).to.be.equal('github');
          expect(res.body.username).to.be.equal('asood123');
          expect(res.body.connectedAccountId).to.be.equal(1);
          done();
        });
      });
    });
  });
});
