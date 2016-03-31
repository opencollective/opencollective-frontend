/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var config = require('config');
var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('supertest');
var utils = require('../test/utils.js')();

/**
 * Variables.
 */
var userData = utils.data('user1');
var paypalPaymentMethod = utils.data('paymentMethod1');
var stripePaymentMethod = utils.data('paymentMethod2');
var models = app.set('models');

/**
 * Tests.
 */
describe('paymentMethods.routes.test.js', () => {

  var application;
  var user;
  var user2;
  var paymentMethod1;
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

  // Create users.
  beforeEach((done) => {
    models.User.create(utils.data('user1')).done((e, u) => {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  beforeEach((done) => {
    models.User.create(utils.data('user2')).done((e, u) => {
      expect(e).to.not.exist;
      user2 = u;
      done();
    });
  });

  // Create paymentMethod.
  beforeEach((done) => {
    var data = _.extend(paypalPaymentMethod, { UserId: user.id });
    models.PaymentMethod.create(data).done((e, c) => {
      expect(e).to.not.exist;
      paymentMethod1 = c;
      done();
    });
  });

  beforeEach((done) => {
    var data = _.extend(stripePaymentMethod, { UserId: user.id });
    models.PaymentMethod.create(data).done((e, c) => {
      expect(e).to.not.exist;
      paymentMethod2 = c;
      done();
    });
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Get user's groups.
   */
  describe('#getUserGroups', () => {

    it('fails getting another user\'s paymentMethods', (done) => {
      request(app)
        .get('/users/' + user.id + '/payment-methods')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end((e, res) => {
          expect(e).to.not.exist;
          done();
        });
    });

    it('successfully get a user\'s paymentMethod', (done) => {
      request(app)
        .get('/users/' + user.id + '/payment-methods')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          var body = res.body;
          expect(body).to.have.length(2);
          expect(body[0].id).to.be.equal(paymentMethod1.id);
          expect(body[0].service).to.be.equal(paymentMethod1.service);
          expect(body[0].token).to.be.equal(paymentMethod1.token);
          done();
        });
    });

    it('successfully get a user\'s paymentMethod and filters by service', (done) => {
      request(app)
        .get('/users/' + user.id + '/payment-methods')
        .query({
          filter: {
            service: 'paypal'
          }
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          var body = res.body;

          expect(body).to.have.length(1);
          expect(body[0].id).to.be.equal(paymentMethod1.id);
          expect(body[0].service).to.be.equal(paymentMethod1.service);
          expect(body[0].token).to.be.equal(paymentMethod1.token);
          done();
        });
    });

  });
});
