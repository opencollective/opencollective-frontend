import {expect} from 'chai';
import request from 'supertest';
import nock from 'nock';
import _ from 'lodash';
import sinon from 'sinon';
import app from '../server/index';
import activities from '../server/constants/activities';
import { type } from '../server/constants/transactions';
import * as utils from '../test/utils';
import models from '../server/models';
import stripeMock from './mocks/stripe';
import emailLib from '../server/lib/email';
import * as payments from '../server/lib/payments';
import initNock from './webhooks.routes.test.nock.js';

/**
 * Mock data
 */
const userData = utils.data('user1');
const collectiveData = utils.data('collective1');
const webhookEvent = stripeMock.webhook;
const webhookInvoice = webhookEvent.data.object;
const webhookSubscription = webhookInvoice.lines.data[0];

const STRIPE_URL = 'https://api.stripe.com:443';
const CURRENCY = 'USD';
const INTERVAL = 'month';

describe('webhooks.routes.test.js', () => {
  const nocks = {};
  let sandbox, user, host, paymentMethod, collective, order, emailSendSpy, stripeToken;

  before(async () => {
    initNock();
    sandbox = sinon.sandbox.create();
    stripeToken = await utils.createStripeToken();
  });

  after(() => sandbox.restore());

  beforeEach(() => {
    emailSendSpy = sandbox.spy(emailLib, 'send');
  });

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  beforeEach(() => models.User.createUserWithCollective(userData).tap(u => user = u));
  beforeEach(() => models.User.createUserWithCollective({ email: 'host@opencollective.com'}).tap(u => host = u));

  // Create a collective.
  beforeEach('create a collective', () => models.Collective.create(collectiveData).then(c => collective = c));
  beforeEach('attach a host', () => models.Member.create({
    CreatedByUserId: host.id,
    MemberCollectiveId: host.CollectiveId,
    CollectiveId: collective.id,
    role: 'HOST'
  }));

  // create a stripe account
  beforeEach(() =>
    models.ConnectedAccount.create({
      service: 'stripe',
      token: 'sk_test_XOFJ9lGbErcK5akcfdYM1D7j',
      username: 'acct_198T7jD8MNtzsDcg',
      CollectiveId: host.CollectiveId
    }));

  afterEach(() => utils.clearbitStubAfterEach(sandbox));

  describe('success', () => {

    const customWebhookEvent = _.extend({}, webhookEvent, {
      id: webhookEvent.id.replace(/0/g, 3),
      type: 'invoice.payment_succeeded'
    });  

    beforeEach('Nock for retrieving charge', () => {
      nocks['charge.retrieve'] = nock(STRIPE_URL)
        .get('/v1/charges/ch_17KUJnBgJgc4Ba6uvdu1hxm4')
        .twice()
        .reply(200, stripeMock.charges.create);
    });

    // Now we make the order using above beforeEach calls
    beforeEach('Make the order', () => {
      return models.Order
        .create({
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          ToCollectiveId: collective.id,
          totalAmount: webhookSubscription.amount,
          currency: CURRENCY
        })
        .then((order) => {
          order.currency
          order.interval = INTERVAL;
          return order.setPaymentMethod({ token: stripeToken })
        })
        .then(order => payments.executeOrder(user, order));
    });

    /*
     * Next beforeEach calls confirm that order went through
     */
    beforeEach('Find order', (done) => {
      models.Order.findAndCountAll({
          include: [
            {
              model: models.Subscription
            }
          ]
        })
        .tap((res) => {
          expect(res.count).to.equal(1);
          order = res.rows[0];
          expect(order.processedAt).to.not.be.null;
          done();
        })
        .catch(done);
    });

    beforeEach('Find paymentMethod', (done) => {
      models.PaymentMethod.findAndCountAll({
        where: {
          CreatedByUserId: order.CreatedByUserId
        }})
        .tap((res) => {
          expect(res.count).to.equal(1);
          paymentMethod = res.rows[0];
          done();
        })
        .catch(done);
    });

    /*
     * These beforeEach calls are setting up for webhook
     */

    // Now we send the webhook
    beforeEach('send webhook', (done) => {
      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${customWebhookEvent.id}`)
        .reply(200, customWebhookEvent);

      request(app)
        .post('/webhooks/stripe')
        .send(customWebhookEvent)
        .expect(200)
        .end((err) => {
          expect(err).to.not.exist;
          done();
        });
    });

    it('adds a transaction', (done) => {
      models.Transaction.findAndCountAll({
        where: {
          OrderId: order.id
        },
        include: [{
          model: models.Order,
          include: [{
            model: models.Subscription
          }]
        }]
      })
      .tap((res) => {
        expect(res.count).to.equal(4);
        const transaction = res.rows[1];
        expect(transaction.OrderId).to.be.equal(order.id);
        expect(transaction.ToCollectiveId).to.be.equal(order.ToCollectiveId);
        expect(transaction.CreatedByUserId).to.be.equal(order.CreatedByUserId);
        expect(transaction.PaymentMethodId).to.be.equal(paymentMethod.id);
        expect(transaction.currency).to.be.equal(CURRENCY);
        expect(transaction.type).to.be.equal(type.DONATION);
        expect(transaction).to.have.property('amountInTxnCurrency', 28652); // taken from stripe mocks
        expect(transaction).to.have.property('txnCurrency', 'EUR');
        expect(transaction).to.have.property('hostFeeInTxnCurrency', 2865);
        expect(transaction).to.have.property('platformFeeInTxnCurrency', 1433);
        expect(transaction).to.have.property('paymentProcessorFeeInTxnCurrency', 856);
        expect(transaction).to.have.property('txnCurrencyFxRate', 1.22155521429569);
        expect(transaction).to.have.property('netAmountInCollectiveCurrency', 28704)
        expect(transaction.amount).to.be.equal(webhookSubscription.amount);
        expect(transaction.Order.Subscription.isActive).to.be.equal(true);
        expect(transaction.Order.Subscription).to.have.property('activatedAt');
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
          expect(e.id).to.be.equal(customWebhookEvent.id);
          done();
        })
        .catch(done);
    });

    it('fail to create a second transaction with the same charge id', done => {
      const anotherWebhookEvent = _.cloneDeep(webhookEvent);
      anotherWebhookEvent.id = anotherWebhookEvent.id.replace(/0/g, 4);
      anotherWebhookEvent.data.object.charge = 'ch_17KUJnBgJgc4Ba6uvdu1hxm4';
      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/${anotherWebhookEvent.id}`)
        .reply(200, anotherWebhookEvent);

      request(app)
        .post('/webhooks/stripe')
        .send(anotherWebhookEvent)
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
            include: [{ 
              model: models.Order,
              include: [{
                model: models.Subscription
              }]
            }]
          })
          .tap(res => {
            expect(res.count).to.be.equal(6); // third transaction
            const transaction = res.rows[2];
            expect(transaction.ToCollectiveId).to.be.equal(order.ToCollectiveId);
            expect(transaction.CreatedByUserId).to.be.equal(order.CreatedByUserId);
            expect(transaction.PaymentMethodId).to.be.equal(paymentMethod.id);
            expect(transaction.currency).to.be.equal(CURRENCY);
            expect(transaction.type).to.be.equal(type.DONATION);
            expect(transaction.amount).to.be.equal(webhookSubscription.amount);

            expect(res.rows[0]).to.have.property('amountInTxnCurrency', 28652); // taken from stripe mocks
            expect(res.rows[0]).to.have.property('txnCurrency', 'EUR');
            expect(res.rows[0]).to.have.property('hostFeeInTxnCurrency', 2865);
            expect(res.rows[0]).to.have.property('platformFeeInTxnCurrency', 1433);
            expect(res.rows[0]).to.have.property('paymentProcessorFeeInTxnCurrency', 856);
            expect(transaction).to.have.property('txnCurrencyFxRate', 1.22155521429569);
            expect(transaction).to.have.property('netAmountInCollectiveCurrency', 28704);
            expect(transaction.Order.Subscription.isActive).to.be.equal(true);
            expect(transaction.Order.Subscription).to.have.property('activatedAt');
            expect(transaction.Order.Subscription.interval).to.be.equal('month');

            expect(emailSendSpy.callCount).to.equal(3);
            expect(emailSendSpy.thirdCall.args[0])
            expect(emailSendSpy.thirdCall.args[0]).to.equal('thankyou');
            expect(emailSendSpy.thirdCall.args[2].firstPayment).to.be.false;
            expect(emailSendSpy.thirdCall.args[1]).to.equal(user.email);

            done();
          })
          .catch(done);

        });
    });

    it('successfully sends out an invoice by email to donor', () => {
      expect(emailSendSpy.callCount).to.equal(2);
      expect(emailSendSpy.secondCall.args[0])
      expect(emailSendSpy.secondCall.args[0]).to.equal('thankyou');
      expect(emailSendSpy.secondCall.args[2].firstPayment).to.be.false;
      expect(emailSendSpy.secondCall.args[1]).to.equal(user.email);
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

      event.id = event.id.replace(/0/g, 1);

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
      nocks['events.retrieve'] = nock(STRIPE_URL)
        .get(`/v1/events/123`)
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
          id: 123
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
      e.id = e.id.replace(/0/g, 2);
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
