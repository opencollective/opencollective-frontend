import { expect } from 'chai';
import request from 'supertest';
import async from 'async';
import nock from 'nock';
import config from 'config';
import app from '../server/index';
import models from '../server/models';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';

const application = utils.data('application');

describe('stripe.routes.test.js', () => {

  let user;
  let user2;
  let group;

  beforeEach(() => utils.resetTestDB());

  // Create a user.
  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

  // Create a user.
  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

  // Create a group.
  beforeEach((done) => {
    request(app)
      .post('/groups')
      .send({
        api_key: application.api_key,
        group: Object.assign(utils.data('group1'), { users: [{ email: user.email, role: roles.HOST}]})
      })
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        group = res.body;
        done();
      });
  });

  // Add user2 as backer to group.
  beforeEach((done) => {
    request(app)
      .post(`/groups/${group.id}/users/${user2.id}?api_key=${application.api_key}`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .expect(200)
      .end(e => {
        expect(e).to.not.exist;
        done();
      });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('authorize', () => {
    it('should return an error if the user is not logged in', (done) => {
      request(app)
        .get('/stripe/authorize?api_key=${application.api_key}')
        .expect(401)
        .end(done);
    });

    it('should fail if the group does not have an host', (done) => {
      request(app)
        .get(`/stripe/authorize?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user2.jwt()}`)
        .expect(400)
        .end((err, res) => {
          expect(err).not.to.exist;
          expect(res.body.error.code).to.be.equal(400);
          expect(res.body.error.type).to.be.equal('bad_request');
          expect(res.body.error.message).to.be.equal('User 2 is not a host');
          done();
        });
    });

    it('should redirect to stripe', (done) => {
      request(app)
        .get(`/stripe/authorize?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200) // redirect
        .end((e, res) => {
          expect(e).to.not.exist;

          expect(res.body.redirectUrl).to.contain('https://connect.stripe.com/oauth/authorize')
          expect(res.body.redirectUrl).to.contain(`state=${group.id}`)
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
      nock('https://connect.stripe.com')
      .post('/oauth/token', {
        grant_type: 'authorization_code',
        client_id: config.stripe.clientId,
        client_secret: config.stripe.secret,
        code: 'abc'
      })
      .reply(200, stripeResponse);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should fail if the state is empty', (done) => {
      request(app)
        .get(`/stripe/oauth/callback?api_key=${application.api_key}`)
        .expect(400)
        .end(done);
    });

    it('should fail if the user does not exist', (done) => {
      request(app)
        .get(`/stripe/oauth/callback?api_key=${application.api_key}&state=123412312`)
        .expect(400)
        .end((err, res) => {
          expect(err).not.to.exist;
          expect(res.body.error.code).to.be.equal(400);
          expect(res.body.error.type).to.be.equal('bad_request');
          expect(res.body.error.message).to.be.equal('User 123412312 is not a host');
          done();
        });
    });

    it('should fail if the user is not a host', (done) => {
      request(app)
        .get(`/stripe/oauth/callback?state=${user2.id}&api_key=${application.api_key}`)
        .expect(400)
        .end((err, res) => {
          expect(err).not.to.exist;
          expect(res.body.error.code).to.be.equal(400);
          expect(res.body.error.type).to.be.equal('bad_request');
          expect(res.body.error.message).to.be.equal(`User ${user2.id} is not a host`);
          done();
        });
    });

    it('should set a stripeAccount', (done) => {
      async.auto({
        request: (cb) => {
          request(app)
            .get(`/stripe/oauth/callback?state=${user.id}&code=abc&api_key=${application.api_key}`)
            .expect(302)
            .end(() => cb());
        },

        checkStripeAccount: ['request', (cb) => {
          models.StripeAccount.findAndCountAll({})
            .then(res => {
              expect(res.count).to.be.equal(1);
              const account = res.rows[0];
              expect(account).to.have.property('accessToken', stripeResponse.access_token);
              expect(account).to.have.property('refreshToken', stripeResponse.refresh_token);
              expect(account).to.have.property('tokenType', stripeResponse.token_type);
              expect(account).to.have.property('stripePublishableKey', stripeResponse.stripe_publishable_key);
              expect(account).to.have.property('stripeUserId', stripeResponse.stripe_user_id);
              expect(account).to.have.property('scope', stripeResponse.scope);
              cb(null, account);
            })
            .catch(cb);
        }],

        checkUser: ['checkStripeAccount', (cb, results) => {
          models.User.findAndCountAll({
            where: {
              StripeAccountId: results.checkStripeAccount.id
            }
          })
          .then(res => {
            expect(res.count).to.be.equal(1);
            expect(res.rows[0].id).to.be.equal(user.id);
            cb();
          })
          .catch(cb);
        }]
      }, done);

    });
  });

});
