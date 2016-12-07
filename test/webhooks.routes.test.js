import {expect} from 'chai';
import request from 'supertest';
import nock from 'nock';
import _ from 'lodash';
import chanceLib from 'chance';
import sinon from 'sinon';
import app from '../server/index';
import roles from '../server/constants/roles';
import activities from '../server/constants/activities';
import {type} from '../server/constants/transactions';
import * as utils from '../test/utils';
import {planId as generatePlanId} from '../server/lib/utils';
import models from '../server/models';
import {appStripe} from '../server/gateways/stripe';
import stripeMock from './mocks/stripe';
import emailLib from '../server/lib/email';

const chance = chanceLib.Chance();

/**
 * Mock data
 */
const application = utils.data('application');
const userData = utils.data('user1');
const groupData = utils.data('group1');
let stripeEmail;
const webhookEvent = stripeMock.webhook;
const webhookInvoice = webhookEvent.data.object;
const webhookSubscription = webhookInvoice.lines.data[0];
const customerId = stripeMock.customers.create.id;

const STRIPE_TOKEN = 'superStripeToken';
const STRIPE_URL = 'https://api.stripe.com:443';
const STRIPE_SUBSCRIPTION_CHARGE = webhookSubscription.amount;
const CURRENCY = 'USD';
const INTERVAL = 'month';

const stubStripe = () => {
  const mock = stripeMock.accounts.create;
  mock.email = chance.email();
  stripeEmail = mock.email;

  const stub = sinon.stub(appStripe.accounts, 'create');
  stub.yields(null, mock);
};


describe('webhooks.routes.test.js', () => {
  const nocks = {};
  let sandbox, user, paymentMethod, group, donation, emailSendSpy;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  beforeEach(() => {
    emailSendSpy = sandbox.spy(emailLib, 'send');
  });

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  beforeEach(() => models.User.create(userData).tap(u => user = u));

  // Create a group.
  beforeEach((done) => {
    stubStripe();

    request(app)
      .post('/groups')
      .send({
        api_key: application.api_key,
        group: Object.assign(groupData, { users: [{ email: user.email, role: roles.HOST}]})
      })
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        group = res.body;
        appStripe.accounts.create.restore();
        done();
      });
  });

  // create a stripe account
  beforeEach(() =>
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => user.setStripeAccount(account)));

  afterEach(() => nock.cleanAll());

  afterEach(() => utils.clearbitStubAfterEach(sandbox));

  describe('success', () => {
    const planId = generatePlanId({
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
      const plan = _.extend({}, stripeMock.plans.create, {
        amount: STRIPE_SUBSCRIPTION_CHARGE,
        interval: INTERVAL,
        name: planId,
        id: planId
      });

      nocks['plans.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/plans/${planId}`)
        .reply(200, plan);
    });

    // Nock for subscriptions.create.
    beforeEach(() => {
      const params = [
        `plan=${planId}`,
        'application_fee_percent=5',
        `${encodeURIComponent('metadata[groupId]')}=${group.id}`,
        `${encodeURIComponent('metadata[groupName]')}=${encodeURIComponent(groupData.name)}`,
        `${encodeURIComponent('metadata[paymentMethodId]')}=1`,
        `${encodeURIComponent('metadata[description]')}=${encodeURIComponent(`OpenCollective: ${group.slug}`)}`
      ].join('&');

      nocks['subscriptions.create'] = nock(STRIPE_URL)
        .post(`/v1/customers/${customerId}/subscriptions`, params)
        .reply(200, webhookSubscription);
    });

    // Nock for retrieving charge
    beforeEach(() => {
      nocks['charge.retrieve'] = nock(STRIPE_URL)
        .get('/v1/charges/ch_17KUJnBgJgc4Ba6uvdu1hxm4')
        .reply(200, stripeMock.charges.create);
    });

    // Nock for retrieving balance transaction
    beforeEach(() => {
      nocks['balance.retrieveTransaction'] = nock(STRIPE_URL)
        .get('/v1/balance/history/txn_165j8oIqnMN1wWwOKlPn1D4y')
        .reply(200, stripeMock.balance);
    });

    // Make the donation
    beforeEach((done) => {
      const payment = {
        stripeToken: STRIPE_TOKEN,
        amount: webhookSubscription.amount / 100,
        currency: CURRENCY,
        interval: INTERVAL,
        email: stripeEmail
      };

      request(app)
        .post(`/groups/${group.id}/payments`)
        .send({
          api_key: application.api_key,
          payment
        })
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.success).to.be.true;
          done();
        });
    });

    // Find the donation
    beforeEach((done) => {
      models.Donation.findAndCountAll({
          include: [
            {
              model: models.Subscription
            }
          ]
        })
        .tap((res) => {
          expect(res.count).to.equal(1);
          donation = res.rows[0];
          expect(donation.isProcessed).to.equal(true);
          done();
        })
        .catch(done);
    });

    // Find the paymentMethod
    beforeEach((done) => {
      models.PaymentMethod.findAndCountAll({
        where: {
          UserId: donation.UserId
        }})
        .tap((res) => {
          expect(res.count).to.equal(1);
          paymentMethod = res.rows[0];
          done();
        })
        .catch(done);
    });

    /**
     * Send webhook
     */
    beforeEach('send webhook', (done) => {
      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${webhookEvent.id}`)
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
        .end((err) => {
          expect(err).to.not.exist;
          done();
        });
    });

    it('successfully gets a Stripe charge', () => {
      expect(nocks['charge.retrieve'].isDone()).to.be.true;
    });

    it('successfully gets a Stripe balance', () => {
      expect(nocks['balance.retrieveTransaction'].isDone()).to.be.true;
    });

    it('adds the first transaction', (done) => {
      models.Transaction.findAndCountAll({
        where: {
          DonationId: donation.id
        },
        include: [
          {
            model: models.Subscription,
          }
        ]
      })
      .tap((res) => {
        expect(res.count).to.equal(1);
        res.rows.forEach((transaction) => {
          expect(transaction.DonationId).to.be.equal(donation.id);
          expect(transaction.GroupId).to.be.equal(donation.GroupId);
          expect(transaction.UserId).to.be.equal(donation.UserId);
          expect(transaction.PaymentMethodId).to.be.equal(paymentMethod.id);
          expect(transaction.currency).to.be.equal(CURRENCY);
          expect(transaction.type).to.be.equal(type.DONATION);
          expect(res.rows[0]).to.have.property('amountInTxnCurrency', 140000); // taken from stripe mocks
          expect(res.rows[0]).to.have.property('txnCurrency', 'USD');
          expect(res.rows[0]).to.have.property('hostFeeInTxnCurrency', 14000);
          expect(res.rows[0]).to.have.property('platformFeeInTxnCurrency', 7000);
          expect(res.rows[0]).to.have.property('paymentProcessorFeeInTxnCurrency', 15500);
          expect(res.rows[0]).to.have.property('txnCurrencyFxRate', 0.25);
          expect(res.rows[0]).to.have.property('netAmountInGroupCurrency', 25875)
          expect(transaction.amount).to.be.equal(webhookSubscription.amount / 100);
          expect(transaction.Subscription.isActive).to.be.equal(true);
          expect(transaction.Subscription).to.have.property('activatedAt');
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
        .tap((res) => {
          const e = res.rows[0].data.event;
          expect(res.count).to.equal(1);
          expect(e.id).to.be.equal(webhookEvent.id);
          done();
        })
        .catch(done);
    });

    it('fail to create a second transaction with the same charge id', done => {
      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${webhookEvent.id}`)
        .reply(200,
          _.extend({},
            webhookEvent, {
            type: 'invoice.payment_succeeded'
          })
        );

      request(app)
        .post('/webhooks/stripe')
        .send(webhookEvent)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'This chargeId: ch_17KUJnBgJgc4Ba6uvdu1hxm4 already exists.'
          }
        })
        .end(done)
    });

    it('should create a second transaction after the first webhook with different chargeid', done => {
      const newWebhookEvent = _.cloneDeep(webhookEvent);
      newWebhookEvent.data.object.charge = 'ch_charge2';
      newWebhookEvent.id = 'evt_0002';

      nocks['events2.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${newWebhookEvent.id}`)
        .reply(200,
          _.extend({},
            newWebhookEvent, {
            type: 'invoice.payment_succeeded'
          })
        );
      nocks['charge2.retrieve'] = nock(STRIPE_URL)
        .get('/v1/charges/ch_charge2')
        .reply(200, stripeMock.charges.create);

      nocks['balance.retrieveTransaction'] = nock(STRIPE_URL)
        .get('/v1/balance/history/txn_165j8oIqnMN1wWwOKlPn1D4y')
        .reply(200, stripeMock.balance);

      request(app)
        .post('/webhooks/stripe')
        .send(newWebhookEvent)
        .expect(200)
        .end(err => {
          expect(err).to.not.exist;
          models.Transaction.findAndCountAll({
            include: [
              { model: models.Subscription }
            ]
          })
          .tap(res => {
            expect(res.count).to.be.equal(2); // second transaction
            res.rows.forEach((transaction) => {
              expect(transaction.GroupId).to.be.equal(donation.GroupId);
              expect(transaction.UserId).to.be.equal(donation.UserId);
              expect(transaction.PaymentMethodId).to.be.equal(paymentMethod.id);
              expect(transaction.currency).to.be.equal(CURRENCY);
              expect(transaction.type).to.be.equal(type.DONATION);
              expect(transaction.amount).to.be.equal(webhookSubscription.amount / 100);

              expect(res.rows[0]).to.have.property('amountInTxnCurrency', 140000); // taken from stripe mocks
              expect(res.rows[0]).to.have.property('txnCurrency', 'USD');
              expect(res.rows[0]).to.have.property('hostFeeInTxnCurrency', 14000);
              expect(res.rows[0]).to.have.property('platformFeeInTxnCurrency', 7000);
              expect(res.rows[0]).to.have.property('paymentProcessorFeeInTxnCurrency', 15500);
              expect(res.rows[0]).to.have.property('txnCurrencyFxRate', 0.25);
              expect(res.rows[0]).to.have.property('netAmountInGroupCurrency', 25875);
              expect(transaction.Subscription.isActive).to.be.equal(true);
              expect(transaction.Subscription).to.have.property('activatedAt');
              expect(transaction.Subscription.interval).to.be.equal('month');

              expect(emailSendSpy.callCount).to.equal(3);
              expect(emailSendSpy.secondCall.args[0])
              expect(emailSendSpy.secondCall.args[0]).to.equal('thankyou');
              expect(emailSendSpy.secondCall.args[2].firstPayment).to.be.true;
              expect(emailSendSpy.thirdCall.args[2].firstPayment).to.be.false;
              expect(emailSendSpy.thirdCall.args[1]).to.equal(stripeEmail);
            });

            done();
          })
          .catch(done);

        });
    });

    it('successfully sends out an invoice by email to donor', () => {
      expect(emailSendSpy.callCount).to.equal(2);
      expect(emailSendSpy.secondCall.args[0])
      expect(emailSendSpy.secondCall.args[0]).to.equal('thankyou');
      expect(emailSendSpy.secondCall.args[2].firstPayment).to.be.true;
      expect(emailSendSpy.secondCall.args[1]).to.equal(stripeEmail);
    });
  });

  it('returns 200 if the event is not livemode in production', (done) => {
    const event = _.extend({}, webhookEvent, {
      livemode: false
    });

    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    nocks['events.retrieve'] = nock(STRIPE_URL)
      .get(`/v1/events/${event.id}`)
      .reply(200, event);

    request(app)
      .post('/webhooks/stripe')
      .send(event)
      .expect(200)
      .end((err) => {
        expect(err).to.not.exist;
        process.env.NODE_ENV = env;
        expect(nocks['events.retrieve'].isDone()).to.be.false;
        done();
      });
  });

  describe('errors', () => {

    it('returns an error if the event is not `invoice.payment_succeeded`', (done) => {
      const event = _.extend({}, webhookEvent, {
        type: 'application_fee.created'
      });

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${event.id}`)
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
      const { id } = webhookEvent;

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${id}`)
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
          id
        })
        .expect(400)
        .end(done);
    });

    it('returns an error if the subscription id does not appear in an exisiting transaction in production', (done) => {
      const e = _.extend({}, webhookEvent, { type: 'invoice.payment_succeeded' });
      e.data.object.lines.data[0].id = 'abc';

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${webhookEvent.id}`)
        .reply(200, e);

      const env = app.set('env');
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

    it('returns 200 if the subscription id does not appear in an existing transaction in NON-production', (done) => {
      const e = _.extend({}, webhookEvent, { type: 'invoice.payment_succeeded' });
      e.data.object.lines.data[0].id = 'abc';

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${webhookEvent.id}`)
        .reply(200, e);

      request(app)
        .post('/webhooks/stripe')
        .send(e)
        .expect(200)
        .end(done);

    });

    it('returns 200 if the plan id is not valid', (done) => {
      const e = _.extend({}, webhookEvent);
      e.data.object.lines.data[0].plan.id = 'abc';

      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${e.id}`)
        .reply(200, e);

      request(app)
        .post('/webhooks/stripe')
        .send(e)
        .expect(200)
        .end((err) => {
          expect(err).to.not.exist;

          models.Activity
            .findAndCountAll({
              where: {
                type: activities.WEBHOOK_STRIPE_RECEIVED
              }
            })
            .tap((res) => {
              expect(res.count).to.equal(0); // nothing is created
              done();
            })
            .catch(done);
        });

    });


  });

});
