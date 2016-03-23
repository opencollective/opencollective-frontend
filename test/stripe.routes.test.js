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
var roles = require('../app/constants/roles');

/**
 * Mock data
 */

var stripeMock = require('./mocks/stripe');

describe('stripe.routes.test.js', function() {

  var nocks = {};

  var user;
  var user2;
  var paymentMethod;
  var group;
  var application;
  var sandbox = sinon.sandbox.create();

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
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
  beforeEach(function(done) {
    models.User.create(utils.data('user1')).done(function(e, u) {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Create a user.
  beforeEach(function(done) {
    models.User.create(utils.data('user2')).done(function(e, u) {
      expect(e).to.not.exist;
      user2 = u;
      done();
    });
  });

  // Create a group.
  beforeEach(function(done) {
    request(app)
      .post('/groups')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send({
        group: utils.data('group1'),
        role: roles.HOST
      })
      .expect(200)
      .end(function(e, res) {
        expect(e).to.not.exist;
        group = res.body;
        done();
      });
  });

  // Add user2 as backer to group.
  beforeEach(function(done) {
    request(app)
      .post('/groups/' + group.id + '/users/' + user2.id)
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .expect(200)
      .end(function(e, res) {
        expect(e).to.not.exist;
        done();
      });
  });

  afterEach(function() {
    nock.cleanAll();
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  describe('authorize', function() {
    it('should return an error if the user is not logged in', function(done) {
      request(app)
        .get('/stripe/authorize')
        .expect(401)
        .end(done);
    });

    it('should fail is the group does not have an host', function(done) {
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

    it('should redirect to stripe', function(done) {
      request(app)
        .get('/stripe/authorize')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200) // redirect
        .end(function(e, res) {
          expect(e).to.not.exist;

          expect(res.body.redirectUrl).to.contain('https://connect.stripe.com/oauth/authorize')
          expect(res.body.redirectUrl).to.contain('state=' + group.id)
          done();
        });
    });
  });

  describe('callback', function() {
    var stripeResponse = {
      access_token: 'sk_test_123',
      refresh_token: 'rt_123',
      token_type: 'bearer',
      stripe_publishable_key: 'pk_test_123',
      stripe_user_id: 'acct_123',
      scope: 'read_write'
    };

    beforeEach(function() {
      nock('https://connect.stripe.com')
      .post('/oauth/token', {
        grant_type: 'authorization_code',
        client_id: config.stripe.clientId,
        client_secret: config.stripe.secret,
        code: 'abc'
      })
      .reply(200, stripeResponse);
    });

    afterEach(function() {
      nock.cleanAll();
    });

    it('should fail if the state is empty', function(done) {
      request(app)
        .get('/stripe/oauth/callback')
        .expect(400)
        .end(done);
    });

    it('should fail if the user does not exist', function(done) {
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

    it('should fail if the user is not a host', function(done) {
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

    it('should set a stripeAccount', function(done) {
      var url = '/stripe/oauth/callback?state=' + user.id + '&code=abc';

      async.auto({
        request: function(cb) {
          request(app)
            .get(url)
            .expect(302)
            .end(function(e, r) {
              console.log("error: ", e);
              console.log("response: ", r.body);
              cb();
            });
        },

        checkStripeAccount: ['request', function(cb) {
          models.StripeAccount.findAndCountAll({})
            .done(function(e, res) {
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

        checkUser: ['checkStripeAccount', function(cb, results) {
          models.User.findAndCountAll({
            where: {
              StripeAccountId: results.checkStripeAccount.id
            }
          })
          .done(function(e, res) {
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
