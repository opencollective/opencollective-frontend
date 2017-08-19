import { expect } from 'chai';
import request from 'supertest';
import async from 'async';
import nock from 'nock';
import config from 'config';
import app from '../server/index';
import models from '../server/models';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import jwt from 'jsonwebtoken';

const application = utils.data('application');

describe('stripe.routes.test.js', () => {

  let host, user, collective;

  beforeEach(() => utils.resetTestDB());

  beforeEach('create a host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => host = u));
  beforeEach('create a user', () => models.User.createUserWithCollective(utils.data('user1')).tap(u => user = u));
  beforeEach('create a collective', () => models.Collective.create(utils.data('collective1')).tap(c => collective = c));
  beforeEach('add host', () => collective.addUserWithRole(host, roles.HOST));
  beforeEach('add backer', () => collective.addUserWithRole(user, roles.BACKER));

  afterEach(() => {
    nock.cleanAll();
  });

  describe('authorize', () => {
    it('should return an error if the user is not logged in', (done) => {
      request(app)
        .get('/connected-accounts/stripe?api_key=${application.api_key}')
        .expect(401)
        .end(done);
    });

    it('should fail if the collective already has a stripeAccount', (done) => {
      models.ConnectedAccount.create({ service: 'stripe', CollectiveId: collective.id })
        .then(() => request(app)
          .get(`/connected-accounts/stripe?api_key=${application.api_key}&CollectiveId=${collective.id}`)
          .set('Authorization', `Bearer ${host.jwt()}`)
          .then(response => {
            expect(response.status).to.equal(400);
            expect(response.body.error.type).to.equal('validation_failed');
            done();
          }));
    });

    it('should redirect to stripe', (done) => {
      request(app)
        .get(`/connected-accounts/stripe?api_key=${application.api_key}&CollectiveId=${collective.id}`)
        .set('Authorization', `Bearer ${host.jwt()}`)
        .expect(200) // redirect
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.redirectUrl).to.contain('https://connect.stripe.com/oauth/authorize')
          expect(res.body.redirectUrl).to.contain(`&state=`)
          done();
        });
    });
  });

  describe('callback', () => {
    const stripeResponse = {
      access_token: 'sk_test_123',
      refresh_token: 'rt_123',
      token_type: 'bearer',
      stripe_publishable_key: 'pk_test_123',
      stripe_user_id: 'acct_123',
      scope: 'read_write'
    };

    beforeEach(() => {
      nock('https://connect.stripe.com:443')
      .post('/oauth/token', {
        grant_type: 'authorization_code',
        client_id: config.stripe.clientId,
        client_secret: config.stripe.secret,
        code: 'abc'
      })
      .reply(200, () => stripeResponse);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should fail if the state is empty', (done) => {
      request(app)
        .get(`/connected-accounts/stripe/callback?api_key=${application.api_key}`)
        .expect(400)
        .end(done);
    });

    it('should fail if the state is not a valid JWT', (done) => {
      request(app)
        .get(`/connected-accounts/stripe/callback?api_key=${application.api_key}&state=123412312`)
        .expect(400)
        .end((err, res) => {
          expect(err).not.to.exist;
          expect(res.body.error.code).to.be.equal(400);
          expect(res.body.error.type).to.be.equal('bad_request');
          expect(res.body.error.message).to.contain('Invalid JWT');
          done();
        });
    });

    it('should set a stripeAccount', (done) => {
      const encodedJWT = jwt.sign({
        CollectiveId: collective.id,
        CreatedByUserId: collective.CreatedByUserId
      }, config.keys.opencollective.secret, { expiresIn: '1h' });
      async.auto({
        request: (cb) => {
          request(app)
            .get(`/connected-accounts/stripe/callback?state=${encodedJWT}&code=abc&api_key=${application.api_key}`)
            .expect(302)
            .end(() => cb());
        },

        checkStripeAccount: ['request', (cb) => {
          models.ConnectedAccount.findAndCountAll({})
            .then(res => {
              expect(res.count).to.be.equal(1);
              const account = res.rows[0];
              expect(account).to.have.property('token', stripeResponse.access_token);
              expect(account).to.have.property('refreshToken', stripeResponse.refresh_token);
              expect(account).to.have.property('username', stripeResponse.stripe_user_id);
              expect(account.data).to.have.property('tokenType', stripeResponse.token_type);
              expect(account.data).to.have.property('publishableKey', stripeResponse.stripe_publishable_key);
              expect(account.data).to.have.property('scope', stripeResponse.scope);
              cb(null, account);
            })
            .catch(cb);
        }],

        checkUser: ['checkStripeAccount', (cb, results) => {
          models.Collective.findById(results.checkStripeAccount.id)
          .then(collective => {
            expect(collective.id).to.be.equal(host.CollectiveId);
            cb();
          })
          .catch(cb);
        }]
      }, done);
    });
  });
});
