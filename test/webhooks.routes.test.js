/**
 * Dependencies.
 */

const expect = require('chai').expect;
const request = require('supertest');
const nock = require('nock');
const _ = require('lodash');
const chance = require('chance').Chance();
const sinon = require('sinon');

const app = require('../index');
const roles = require('../app/constants/roles');
const activities = require('../app/constants/activities');
const utils = require('../test/utils.js')();
const generatePlanId = require('../app/lib/utils.js').planId;

const models = app.set('models');

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

var stubStripe = () => {
  var mock = stripeMock.accounts.create;
  mock.email = chance.email();
  stripeEmail = mock.email;

  var stub = sinon.stub(app.stripe.accounts, 'create');
  stub.yields(null, mock);
};

describe('webhooks.routes.test.js', () => {
  var nocks = {};

  var user;
  var card;
  var group;
  var application;
  var firstPayment;

  beforeEach((done) => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  // Create a user.
  beforeEach((done) => {
    models.User.create(userData).done((e, u) => {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Create a group.
  beforeEach((done) => {
    stubStripe();

    request(app)
      .post('/groups')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send({
        group: groupData,
        role: roles.HOST
      })
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        group = res.body;
        app.stripe.accounts.create.restore();
        done();
      });
  });

  beforeEach((done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => user.setStripeAccount(account))
    .then(() => done())
    .catch(done);
  })

  afterEach(() => {
    nock.cleanAll();
  });

  describe('success', () => {
    var planId = generatePlanId({
      amount: STRIPE_SUBSCRIPTION_CHARGE,
      interval: INTERVAL,
      currency: CURRENCY
    });

    // Nock for customers.create.
    beforeEach(() => {
      nocks['customers.create'] = nock(STRIPE_URL)
        .post('/v1/customers')
        .reply(200, stripeMock.customers.create);
    });

    // Nock for plans.retrieve.
    beforeEach(() => {

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
    beforeEach(() => {
      nocks['subscriptions.create'] = nock(STRIPE_URL)
        .post('/v1/customers/' + customerId + '/subscriptions',
          'plan=' + planId + '&application_fee_percent=5')
        .reply(200, webhookSubscription);
    });

    beforeEach((done) => {
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
        .end((err, res) => {
          expect(res.body.success).to.be.true;
          done();
        });
    });

    beforeEach((done) => {
      models.Transaction
        .findAndCountAll({
          where: {
            stripeSubscriptionId: webhookSubscription.id
          }
        })
        .then((res) => {
          firstPayment = res.rows[0];
          done();
        })
        .catch(done);
    });

    /**
     * Send webhook
     */
    beforeEach((done) => {
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

    it('updates the first transaction', (done) => {
      models.Transaction
        .findAndCountAll({
          where: {
            stripeSubscriptionId: webhookSubscription.id
          }
        })
        .then((res) => {
          expect(res.count).to.equal(1);
          res.rows.forEach((transaction) => {
            expect(transaction.id).to.be.equal(firstPayment.id);
            expect(transaction.stripeSubscriptionId).to.be.equal(webhookSubscription.id);
            expect(transaction.GroupId).to.be.equal(firstPayment.CardId);
            expect(transaction.UserId).to.be.equal(firstPayment.UserId);
            expect(transaction.CardId).to.be.equal(firstPayment.CardId);
            expect(transaction.approved).to.be.true;
            expect(transaction.currency).to.be.equal(CURRENCY);
            expect(transaction.type).to.be.equal('payment');
            expect(transaction.amount).to.be.equal(webhookSubscription.amount / 100);
          });
          done();
        })
        .catch(done);
    });

    it('creates an activity', (done) => {
      models.Activity
        .findAndCountAll({
          where: {
            type: activities.WEBHOOK_STRIPE_RECEIVED
          }
        })
        .then((res) => {
          var e = res.rows[0].data.event;
          expect(res.count).to.equal(1);
          expect(e.id).to.be.equal(webhookEvent.id);
          done();
        })
        .catch(done);
    });

    it('should create a new transaction after the first webhook', done => {
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
        .end((err, res) => {
          expect(err).to.not.exist;
          models.Transaction.findAndCountAll()
            .then(res => {
              expect(res.count).to.be.equal(2); // second transaction
              res.rows.forEach((transaction) => {
                expect(transaction.stripeSubscriptionId).to.be.equal(webhookSubscription.id);
                expect(transaction.GroupId).to.be.equal(firstPayment.CardId);
                expect(transaction.UserId).to.be.equal(firstPayment.UserId);
                expect(transaction.CardId).to.be.equal(firstPayment.CardId);
                expect(transaction.approved).to.be.true;
                expect(transaction.currency).to.be.equal(CURRENCY);
                expect(transaction.type).to.be.equal('payment');
                expect(transaction.amount).to.be.equal(webhookSubscription.amount / 100);
              });

              done();
            })
            .catch(done);

        });
    });
  });

  it('returns 200 if the event is not livemode in production', (done) => {
    var event = _.extend({}, webhookEvent, {
      livemode: false
    });

    var env = app.set('env');

    app.set('env', 'production');

    nocks['events.retrieve'] = nock(STRIPE_URL)
      .get('/v1/events/' + event.id)
      .reply(200, event);

    request(app)
      .post('/webhooks/stripe')
      .send(event)
      .expect(200)
      .end((err) => {
        expect(err).to.not.exist;
        app.set('env', env);
        expect(nocks['events.retrieve'].isDone()).to.be.false;
        done();
      });
  });

  describe('errors', () => {

    it('returns an error if the event is not `invoice.payment_succeeded`', (done) => {
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

    it('returns an error if the event does not exist', (done) => {
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

    it('returns an error if the subscription id does not appear in an exisiting transaction in production', (done) => {
      var e = _.extend({}, webhookEvent, { type: 'invoice.payment_succeeded' });
      e.data.object.lines.data[0].id = 'abc';

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get('/v1/events/' + webhookEvent.id)
        .reply(200, e);

      var env = app.set('env');
      app.set('env', 'production');

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
        .end(() => {
          app.set('env', env);
          done();
        });

    });

    it('returns 200 if the subscription id does not appear in an exisiting transaction in NON-production', (done) => {
      var e = _.extend({}, webhookEvent, { type: 'invoice.payment_succeeded' });
      e.data.object.lines.data[0].id = 'abc';

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get('/v1/events/' + webhookEvent.id)
        .reply(200, e);

      request(app)
        .post('/webhooks/stripe')
        .send(e)
        .expect(200)
        .end(done);

    });

  });

});
