import {expect} from 'chai';
import request from 'supertest';
import _ from 'lodash';
import sinon from 'sinon';
import app from '../server/index';
import activities from '../server/constants/activities';
import { type } from '../server/constants/transactions';
import * as utils from '../test/utils';
import models from '../server/models';
import originalStripeMock from './mocks/stripe';
import emailLib from '../server/lib/email';
import * as payments from '../server/lib/payments';
import nock from 'nock';
import initNock from './webhooks.stripe.creditcard.test.nock.js';
import { appStripe } from '../server/paymentProviders/stripe/gateway';

/**
 * Mock data
 */
const userData = utils.data('user1');
const collectiveData = utils.data('collective1');

const CURRENCY = 'USD';
const INTERVAL = 'month';

const hostStripeAccount = {
  service: 'stripe',
  token: 'sk_test_XOFJ9lGbErcK5akcfdYM1D7j',
  username: 'acct_198T7jD8MNtzsDcg'
};

describe('webhooks.stripe.creditcard.test.js', () => {
  let sandbox, user, host, paymentMethod, collective, order, emailSendSpy, stripeToken, stripeMock, webhookEvent, webhookInvoice, webhookSubscription;

  beforeEach(() => {
    initNock();
    stripeMock = _.cloneDeep(originalStripeMock);
    webhookEvent = stripeMock.webhook_payment_succeeded;
    webhookInvoice = webhookEvent.data.object;
    webhookSubscription = webhookInvoice.lines.data[0];
    sandbox = sinon.sandbox.create();
    sandbox.stub(appStripe.events, "retrieve", () => Promise.resolve(stripeMock.webhook_payment_succeeded));
    sandbox.stub(appStripe.charges, "retrieve", () => Promise.resolve(stripeMock.charges.create));
    sandbox.stub(appStripe.customers, "createSubscription", () => Promise.resolve(stripeMock.createSubscription));
    sandbox.stub(appStripe.balance, "retrieveTransaction", () => Promise.resolve(stripeMock.balance));
  });

  afterEach(() => sandbox.restore());

  after(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    emailSendSpy = sandbox.spy(emailLib, 'send');
  });

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  beforeEach(() => models.User.createUserWithCollective(userData).tap(u => user = u));
  beforeEach(() => models.User.createUserWithCollective({ email: 'host@opencollective.com'}).tap(u => {
    host = u;
    hostStripeAccount.CollectiveId = host.CollectiveId;
  }));

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
    models.ConnectedAccount.create(hostStripeAccount));

  afterEach(() => utils.clearbitStubAfterEach(sandbox));

  describe('order is setup', () => {
    let charge2WebhookEvent;

    /*
     * These beforeEach calls are setting up for webhook
     */

    beforeEach('Generate a new stripe token', async () => {
      stripeToken = await utils.createStripeToken();
      charge2WebhookEvent = _.extend({}, webhookEvent, {
        id: webhookEvent.id.replace(/0/g, 3),
        type: 'invoice.payment_succeeded'
      });
      const newChargeId = charge2WebhookEvent.data.object.charge.replace('xm4', 'xm5');
      charge2WebhookEvent.data.object.charge = newChargeId;
      stripeMock.charges.create.id = newChargeId;
    });

    // Now we make the order using above beforeEach calls
    beforeEach('Make the order', () => {
      return models.Order
        .create({
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          CollectiveId: collective.id,
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
          charge2WebhookEvent.data.object.customer = paymentMethod.data.customerIdForHost[hostStripeAccount.username];
          done();
        })
        .catch(done);
    });

    describe('error', () => {
      beforeEach('set an inactive sub', () => {
        return models.Subscription.findById(1)
        .then(sub => sub.update({isActive: false}))
      })

      it('fails if the subscription is marked inactive', (done) => {

        request(app)
          .post('/webhooks/stripe')
          .send(charge2WebhookEvent)
          .expect(400, {
            error: {
              code: 400,
              type: 'bad_request',
              message: 'This subscription is marked inActive'
            }
          })
          .end(err => {
            expect(err).to.not.exist;
            done();
          });
      });
    })


    describe('success', () => {
      // Now we send the webhook
      beforeEach('send webhook', (done) => {
        request(app)
          .post('/webhooks/stripe')
          .send(charge2WebhookEvent)
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
          expect(transaction.CollectiveId).to.be.equal(order.CollectiveId);
          expect(transaction.CreatedByUserId).to.be.equal(order.CreatedByUserId);
          expect(transaction.PaymentMethodId).to.be.equal(paymentMethod.id);
          expect(transaction.currency).to.be.equal(CURRENCY);
          expect(transaction.type).to.be.equal(type.CREDIT);
          expect(transaction).to.have.property('amountInHostCurrency', 140000); // taken from stripe mocks
          expect(transaction).to.have.property('hostCurrency', 'USD');
          expect(transaction).to.have.property('hostFeeInHostCurrency', 14000);
          expect(transaction).to.have.property('platformFeeInHostCurrency', 7000);
          expect(transaction).to.have.property('paymentProcessorFeeInHostCurrency', 15500);
          expect(transaction).to.have.property('hostCurrencyFxRate', 0.25);
          expect(transaction).to.have.property('netAmountInCollectiveCurrency', 25875)
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
            expect(e.id).to.be.equal(webhookEvent.id);
            done();
          })
          .catch(done);
      });

      it('fail to create a second transaction with the same charge id', done => {
        request(app)
          .post('/webhooks/stripe')
          .send(charge2WebhookEvent)
          .expect(400, {
            error: {
              code: 400,
              type: 'bad_request',
              message: `This chargeId: ${stripeMock.charges.create.id} already exists.`
            }
          })
          .end(done)
      });

      it('successfully sends out an invoice by email to donor', () => {
        expect(emailSendSpy.callCount).to.equal(2);
        expect(emailSendSpy.secondCall.args[0])
        expect(emailSendSpy.secondCall.args[2].firstPayment).to.be.false;
        expect(emailSendSpy.secondCall.args[1]).to.equal(user.email);
      });
    });
  });

  describe('errors', () => {


    it('returns an error if the subscription id does not appear in an existing transaction in production', (done) => {
      const e = _.extend({}, webhookEvent, { type: 'invoice.payment_succeeded' });
      e.data.object.lines.data[0].id = 'abc';

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

    it('returns 200 if the subscription id does not appear in an existing order in NON-production', (done) => {
      stripeMock.webhook_payment_succeeded.type = 'invoice.payment_succeeded';
      stripeMock.webhook_payment_succeeded.data.object.lines.data[0].id = 'abc';
      request(app)
        .post('/webhooks/stripe')
        .send(stripeMock.webhook_payment_succeeded)
        .expect(200)
        .end(done);
    });

    it('returns 200 if the plan id is not valid', (done) => {
      const e = _.extend({}, webhookEvent);
      e.id = e.id.replace(/0/g, 2);
      e.data.object.lines.data[0].plan.id = 'abc';
      stripeMock.webhook_payment_succeeded.data.object.lines.data[0].plan.id = 'abc';

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
