/**
 * Dependencies.
 */

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');
var nock = require('nock');
var config = require('config');
var _ = require('lodash');
var chance = require('chance').Chance();
var sinon = require('sinon');

var app = require('../index');
var utils = require('../test/utils.js')();
var models = app.set('models');
var roles = require('../server/constants/roles');

/**
 * Mock data
 */

var stripeMock = require('./mocks/stripe');

describe('stripe.routes.test.js', () => {

  var nocks = {};

  var user;
  var user2;
  var paymentMethod;
  var group;
  var application;
  var sandbox = sinon.sandbox.create();

  beforeEach((done) => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  // Create a user.
  beforeEach((done) => {
    models.User.create(utils.data('user1')).done((e, u) => {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Create a user.
  beforeEach((done) => {
    models.User.create(utils.data('user2')).done((e, u) => {
      expect(e).to.not.exist;
      user2 = u;
      done();
    });
  });

  // Create a group.
  beforeEach((done) => {
    request(app)
      .post('/groups')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send({
        group: utils.data('group1'),
        role: roles.HOST
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
      .post('/groups/' + group.id + '/users/' + user2.id)
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        done();
      });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  describe('authorize', () => {
    it('should return an error if the user is not logged in', (done) => {
      request(app)
        .get('/stripe/authorize')
        .expect(401)
        .end(done);
    });

    it('should fail is the group does not have an host', (done) => {
      request(app)
        .get('/stripe/authorize')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'User is not a host 2'
          }
        })
        .end(done);
    });

    it('should redirect to stripe', (done) => {
      request(app)
        .get('/stripe/authorize')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200) // redirect
        .end((e, res) => {
          expect(e).to.not.exist;

          expect(res.body.redirectUrl).to.contain('https://connect.stripe.com/oauth/authorize')
          expect(res.body.redirectUrl).to.contain('state=' + group.id)
          done();
        });
    });
  });

  describe('callback', () => {
    var stripeResponse = {
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
        .get('/stripe/oauth/callback')
        .expect(400)
        .end(done);
    });

    it('should fail if the user does not exist', (done) => {
      request(app)
        .get('/stripe/oauth/callback?state=123412312')
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'User is not a host 123412312'
          }
        })
        .end(done);
    });

    it('should fail if the user is not a host', (done) => {
      request(app)
        .get('/stripe/oauth/callback?state=' + user2.id)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'User is not a host ' + user2.id
          }
        })
        .end(done);
    });

    it('should set a stripeAccount', (done) => {
      var url = '/stripe/oauth/callback?state=' + user.id + '&code=abc';

      async.auto({
        request: (cb) => {
          request(app)
            .get(url)
            .expect(302)
            .end((e, r) => {
              console.log("error: ", e);
              console.log("response: ", r.body);
              cb();
            });
        },

        checkStripeAccount: ['request', (cb) => {
          models.StripeAccount.findAndCountAll({})
            .done((e, res) => {
              expect(e).to.not.exist;
              expect(res.count).to.be.equal(1);
              var account = res.rows[0];
              expect(account).to.have.property('accessToken', stripeResponse.access_token);
              expect(account).to.have.property('refreshToken', stripeResponse.refresh_token);
              expect(account).to.have.property('tokenType', stripeResponse.token_type);
              expect(account).to.have.property('stripePublishableKey', stripeResponse.stripe_publishable_key);
              expect(account).to.have.property('stripeUserId', stripeResponse.stripe_user_id);
              expect(account).to.have.property('scope', stripeResponse.scope);
              cb(null, account);
            });
        }],

        checkUser: ['checkStripeAccount', (cb, results) => {
          models.User.findAndCountAll({
            where: {
              StripeAccountId: results.checkStripeAccount.id
            }
          })
          .done((e, res) => {
            expect(e).to.not.exist;
            expect(res.count).to.be.equal(1);
            expect(res.rows[0].id).to.be.equal(user.id);
            cb();
          });
        }]
      }, done);

    });
  });

});
