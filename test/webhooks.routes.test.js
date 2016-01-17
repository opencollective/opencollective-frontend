/**
 * Dependencies.
 */

var expect = require('chai').expect;
var request = require('supertest');
var nock = require('nock');
var _ = require('lodash');
var chance = require('chance').Chance();
var sinon = require('sinon');

var app = require('../index');
var roles = require('../app/constants/roles');
var utils = require('../test/utils.js')();
var generatePlanId = require('../app/lib/utils.js').planId;

var models = app.set('models');

/**
 * Mock data
 */

var stripeMock = require('./mocks/stripe');
var userData = utils.data('user1');
var groupData = utils.data('group1');
var stripeEmail;
var webhookEvent = stripeMock.webhook;
var webhookInvoice = webhookEvent.data.object;
var webhookSubscription = webhookInvoice.lines.data[0];
var customerId = stripeMock.customers.create.id;

var STRIPE_TOKEN = 'superStripeToken';
var STRIPE_URL = 'https://api.stripe.com:443';
var CHARGE = 10.99;
var STRIPE_CHARGE = 1099;
var STRIPE_SUBSCRIPTION_CHARGE = webhookSubscription.amount;
var SUBSCRIPTION_CHARGE = webhookSubscription.amount / 100;
var CURRENCY = 'USD';
var INTERVAL = 'month';

var stubStripe = function() {
  var mock = stripeMock.accounts.create;
  mock.email = chance.email();
  stripeEmail = mock.email;

  var stub = sinon.stub(app.stripe.accounts, 'create');
  stub.yields(null, mock);
};

describe('webhooks.routes.test.js', function() {
  var nocks = {};

  var user;
  var card;
  var group;
  var application;

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  // Create a user.
  beforeEach(function(done) {
    models.User.create(userData).done(function(e, u) {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Create a group.
  beforeEach(function(done) {
    stubStripe();

    request(app)
      .post('/groups')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send({
        group: groupData,
        role: roles.HOST,
        stripeEmail: stripeEmail
      })
      .expect(200)
      .end(function(e, res) {
        expect(e).to.not.exist;
        group = res.body;
        app.stripe.accounts.create.restore();
        done();
      });
  });

  beforeEach(function(done) {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then(function(account) {
      return user.setStripeAccount(account);
    })
    .then(function() {
      done();
    })
    .catch(done);
  })

  afterEach(function() {
    nock.cleanAll();
  });

  describe('success', function() {
    var planId = generatePlanId({
      amount: STRIPE_SUBSCRIPTION_CHARGE,
      interval: INTERVAL,
      currency: CURRENCY
    });

    // Nock for customers.create.
    beforeEach(function() {
      nocks['customers.create'] = nock(STRIPE_URL)
        .post('/v1/customers')
        .reply(200, stripeMock.customers.create);
    });

    // Nock for charges.create.
    beforeEach(function() {
      nocks['charges.create'] = nock(STRIPE_URL)
        .post('/v1/charges', 'amount=' + CHARGE * 100 + '&currency=' + CURRENCY + '&customer=' + stripeMock.customers.create.id)
        .reply(200, stripeMock.charges.create);
    });

    // Nock for plans.retrieve.
    beforeEach(function() {

      var plan = _.extend({}, stripeMock.plans.create, {
        amount: STRIPE_SUBSCRIPTION_CHARGE,
        interval: INTERVAL,
        name: planId,
        id: planId
      });

      nocks['plans.retrieve'] = nock(STRIPE_URL)
        .get('/v1/plans/' + planId)
        .reply(200, plan);
    });

    // Nock for subscriptions.create.
    beforeEach(function() {
      nocks['subscriptions.create'] = nock(STRIPE_URL)
        .post('/v1/customers/' + customerId + '/subscriptions',
          'plan=' + planId + '&application_fee_percent=5')
        .reply(200, webhookSubscription);
    });

    beforeEach(function makeDonation(done) {
      var payment = {
        stripeToken: STRIPE_TOKEN,
        amount: webhookSubscription.amount / 100,
        currency: CURRENCY,
        interval: INTERVAL,
        email: stripeEmail
      };

      request(app)
        .post('/groups/' + group.id + '/payments')
        .send({
          api_key: application.api_key,
          payment: payment
        })
        .expect(200)
        .end(function(err, res) {
          expect(res.body.success).to.be.true;
          done();
        });
    });

    beforeEach(function sendWebhook(done) {
      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get('/v1/events/' + webhookEvent.id)
        .reply(200,
          _.extend({},
            webhookEvent, {
            type: 'invoice.payment_succeeded'
          })
        );

      request(app)
        .post('/webhooks/stripe')
        .send(webhookEvent)
        .expect(200)
        .end(done);
    });

    // Fetch card
    beforeEach(function(done) {
      models.Card.findOne({
        where: {
          service: 'stripe',
          serviceId: customerId
        }
      }).done(function(err, res) {
        card = res;
        done();
      });
    });

    it('creates a new transaction', function(done) {
      models.Transaction
        .findAndCountAll({
          where: {
            stripeSubscriptionId: webhookSubscription.id
          }
        })
        .then(function(res) {
          expect(res.count).to.equal(2);
          res.rows.forEach(function(transaction) {
            expect(transaction.stripeSubscriptionId).to.be.equal(webhookSubscription.id);
            expect(transaction.GroupId).to.be.equal(group.id);
            expect(transaction.UserId).to.be.equal(2);
            expect(transaction.CardId).to.be.equal(card.id);
            expect(transaction.approved).to.be.true;
            expect(transaction.currency).to.be.equal(CURRENCY);
            expect(transaction.type).to.be.equal('payment');
            expect(transaction.amount).to.be.equal(webhookSubscription.amount / 100);
          });
          done();
        })
        .catch(done);
    });

    it('creates an activity', function(done) {
      models.Activity
        .findAndCountAll({
          where: {
            type: 'webhook.stripe.received'
          }
        })
        .then(function(res) {
          var e = res.rows[0].data.event;
          expect(res.count).to.equal(1);
          expect(e.id).to.be.equal(webhookEvent.id);
          done();
        })
        .catch(done);
    });
  });

  describe('errors', function() {
    it('returns an error if the event is not `invoice.payment_succeeded`', function(done) {
      var event = _.extend({}, webhookEvent, {
        type: 'application_fee.created'
      });

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get('/v1/events/' + event.id)
        .reply(200, event);

      request(app)
        .post('/webhooks/stripe')
        .send(event)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Wrong event type received'
          }
        })
        .end(done);
    });

    it('returns an error if the event does not exist', function(done) {
      var id = webhookEvent.id;

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get('/v1/events/' + id)
        .reply(200, {
          error: {
            type: 'invalid_request_error',
            message: 'No such event',
            param: 'id',
            requestId: 'req_7Y8TeQytYKcs1k'
          }
        });

      request(app)
        .post('/webhooks/stripe')
        .send({
          id: id
        })
        .expect(400)
        .end(done);
    });

    it('returns an error if the subscription id does not appear in an exisiting transaction', function(done) {
      var e = _.extend({}, webhookEvent, { type: 'invoice.payment_succeeded' });
      e.data.object.lines.data[0].id = 'abc';

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get('/v1/events/' + webhookEvent.id)
        .reply(200, e);

      request(app)
        .post('/webhooks/stripe')
        .send(e)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Transaction not found: unknown subscription id'
          }
        })
        .end(done);

    });

  });

});
