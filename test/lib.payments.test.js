import { expect } from 'chai';
import sinon from 'sinon';

import models from '../server/models';
import * as utils from '../test/utils';
import * as payments from '../server/lib/payments';
import roles from '../server/constants/roles';
import * as stripe from '../server/paymentProviders/stripe/gateway';
import Promise from 'bluebird';

const AMOUNT = 1099;
const AMOUNT2 = 199;
const CURRENCY = 'EUR';
const STRIPE_TOKEN = 'tok_123456781234567812345678';
const EMAIL = 'anotheruser@email.com';
const userData = utils.data('user3');
import stripeMocks from './mocks/stripe';
import emailLib from '../server/lib/email';
import nock from 'nock';

describe('lib.payments.test.js', () => {
  let host, user, user2, collective, order, collective2, sandbox, emailSendSpy;

  before(() => {
    nock('http://api.fixer.io:80', {"encodedQueryParams":true})
    .get('/latest')
    .times(19)
    .query({"base":"EUR","symbols":"USD"})
    .reply(200, {"base":"EUR","date":"2017-10-05","rates":{"USD":1.1742}});
  });

  after(() => {
    nock.cleanAll();
  });

  beforeEach(() => utils.resetTestDB());
  
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(stripe, "createCustomer", () => Promise.resolve({ id: "cus_BM7mGwp1Ea8RtL"}));
    sandbox.stub(stripe, "createToken", () => Promise.resolve({ id: "tok_1AzPXGD8MNtzsDcgwaltZuvp"}));
    sandbox.stub(stripe, "createCharge", () => Promise.resolve({ id: "ch_1AzPXHD8MNtzsDcgXpUhv4pm"}));
    sandbox.stub(stripe, "retrieveBalanceTransaction", () => Promise.resolve(stripeMocks.balance));
    sandbox.stub(stripe, "getOrCreatePlan", () => Promise.resolve(stripeMocks.plans.create));
    sandbox.stub(stripe, "createSubscription", () => Promise.resolve(stripeMocks.subscriptions.create));
    emailSendSpy = sandbox.spy(emailLib, 'send');
  });

  afterEach(() => sandbox.restore());

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  beforeEach('create a user', () => models.User.createUserWithCollective(userData).then(u => user = u));
  beforeEach('create a user', () => models.User.createUserWithCollective({ email: EMAIL, name: "anotheruser"}).then(u => user2 = u));
  beforeEach('create a host', () => models.User.createUserWithCollective(utils.data('host1')).then(u => host = u));
  beforeEach('create a collective', () => models.Collective.create(utils.data('collective1')).then(g => collective = g));
  beforeEach('create a collective', () => models.Collective.create(utils.data('collective2')).then(g => collective2 = g));
  beforeEach('create an order', () => models.Order.create({
    CreatedByUserId: user.id,
    FromCollectiveId: user.CollectiveId,
    CollectiveId: collective.id,
    totalAmount: AMOUNT,
    currency: CURRENCY
  }).then(o => o.setPaymentMethod({ token: STRIPE_TOKEN })).then(t => order = t))
  beforeEach('add host to collective', () => collective.addHost(host.collective));
  beforeEach('add host to collective2', () => collective2.addHost(host.collective));

  beforeEach('create stripe account', (done) => {
    models.ConnectedAccount.create({
      service: 'stripe',
      token: 'abc',
      CollectiveId: host.collective.id
    })
    .tap(() => done())
    .catch(done);
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });


  /**
   * Post a payment.
   */
  describe('Checks payload', () => {

    describe('and fails to create a payment if', () => {

      it('interval is present and it is not month or year', () => {
        order.interval = 'something';
        return payments.executeOrder(user, order)
          .catch(err => expect(err.message).to.equal('Interval should be null, month or year.'));
      });

      it('payment amount is missing', () => {
        order.totalAmount = null;
        return payments.executeOrder(user, order)
          .catch(err => expect(err.message).to.equal('payment.amount missing'));
      });

      it('payment amount is less than 50', () => {
        order.totalAmount = 49;
        return payments.executeOrder(user, order)       
        .catch(err => expect(err.message).to.equal('payment.amount must be at least $0.50'));
      });

      it('stripe token is missing', () => {
        order.PaymentMethodId = null;
        return payments.executeOrder(user, order)
          .catch(err => expect(err.message).to.equal('PaymentMethodId missing in the order'));
      });

    });

    describe('and when the order looks good', () => {

      describe('it fails', () => {

        it('if the host has no stripe account', () => {
          order.CollectiveId = user2.CollectiveId;
          return payments
            .executeOrder(user, order)
            .catch(err => expect(err.message).to.equal('The host for the anotheruser collective has no Stripe account set up (HostCollectiveId: null)'));
        })

        it('if stripe has live key and not in production', () => models.ConnectedAccount
          .update({ service: 'stripe', token: 'sk_live_abc' }, { where: { CollectiveId: host.CollectiveId }})
          .then(() => payments.executeOrder(user, order))
          .catch(err => expect(err.message).to.contain('You can\'t use a Stripe live key')));
      });

      describe('and payment succeeds', () => {

        describe('one-time', () => {

          describe('1st payment', () => {
            
            beforeEach('add transaction for collective 2', () => models.Transaction.createDoubleEntry({
              CollectiveId: collective2.id,
              CreatedByUserId: user2.id,
              FromCollectiveId: user2.CollectiveId,
              netAmountInCollectiveCurrency: 10000,
              amount: 10000,
              type: 'CREDIT',
              PaymentMethodId: order.PaymentMethodId,
              HostCollectiveId: host.CollectiveId
            }));
            beforeEach('execute order', () => payments.executeOrder(user, order));

            it('successfully creates a paymentMethod with the CreatedByUserId', () => models.PaymentMethod
              .findAndCountAll({ where: { CreatedByUserId: user.id }})
              .then((res) => {
                expect(res.count).to.equal(1);
                expect(res.rows[0]).to.have.property('token', STRIPE_TOKEN);
                expect(res.rows[0]).to.have.property('service', 'stripe');
              }));

            it('successfully creates an order in the database', () => models.Order
              .findAndCountAll()
              .then((res) => {
                expect(res.count).to.equal(1);
                const order = res.rows[0];
                expect(order).to.have.property('CreatedByUserId', user.id);
                expect(order).to.have.property('CollectiveId', collective.id);
                expect(order).to.have.property('currency', CURRENCY);
                expect(order).to.have.property('totalAmount', AMOUNT);
              }));

            it('successfully adds the user as a backer', () => models.Member.findOne({
              where: {
                MemberCollectiveId: user.CollectiveId,
                CollectiveId: collective.id,
                role: roles.BACKER
              }
            }).then(member => {
              expect(member).to.exist;
            }));

            it('successfully sends out an email to donor1', (done) => {
              setTimeout(() => {
                expect(emailSendSpy.lastCall.args[0]).to.equal('thankyou');
                expect(emailSendSpy.lastCall.args[1]).to.equal(user.email);
                expect(emailSendSpy.lastCall.args[2].relatedCollectives).to.have.length(1);
                expect(emailSendSpy.lastCall.args[2].relatedCollectives[0]).to.have.property('settings');
                done();
              }, 150);
            });
  
          });

          describe('2nd payment with same stripeToken', () => {
            
            beforeEach('create first payment', () => payments.executeOrder(user, order));

            beforeEach('create 2nd payment', () => {
              order.totalAmount = AMOUNT2;
              order.processedAt = null;
              return payments.executeOrder(user, order);
            });

            it('does not re-create a paymentMethod', (done) => {
              models.PaymentMethod
                .findAndCountAll({ where: { CreatedByUserId: user.id }})
                .then((res) => {
                  expect(res.count).to.equal(1);
                  done();
                })
                .catch(done);
            });
          });
        });

        describe('recurringly', () => {
          let order2;

          beforeEach(() => models.Order
            .create({
              CreatedByUserId: user2.id,
              FromCollectiveId: user2.CollectiveId,
              CollectiveId: collective2.id,
              totalAmount: AMOUNT2,
              currency: collective2.currency
            })
            .then(o => o.setPaymentMethod({ token: STRIPE_TOKEN }))
            .then(o => order2 = o))

          beforeEach('execute order', () => {
            order2.interval = 'month';
            return payments.executeOrder(user, order2)
          });

          it('successfully creates a paymentMethod', () => models.PaymentMethod
            .findAndCountAll({ where: { CreatedByUserId: user2.id }})
            .then((res) => {
              expect(res.count).to.equal(1);
            }));

          it('successfully creates an order in the database', () => models.Order
            .findAndCountAll({})
            .then((res) => {
              expect(res.count).to.equal(2);
              expect(res.rows[1]).to.have.property('CreatedByUserId', user2.id);
              expect(res.rows[1]).to.have.property('CollectiveId', collective2.id);
              expect(res.rows[1]).to.have.property('currency', CURRENCY);
              expect(res.rows[1]).to.have.property('totalAmount', AMOUNT2);
              expect(res.rows[1]).to.have.property('SubscriptionId');
            }));

          it('creates a Subscription model', () => models.Subscription
            .findAndCountAll({})
            .then((res) => {
              const subscription = res.rows[0];

              expect(res.count).to.equal(1);
              expect(subscription).to.have.property('amount', AMOUNT2);
              expect(subscription).to.have.property('interval', 'month');
              expect(subscription).to.have.property('data');
              expect(subscription).to.have.property('isActive', true);
              expect(subscription).to.have.property('currency', CURRENCY);
            }));

          it('successfully sends out an email to donor', (done) => {
            setTimeout(() => {
              expect(emailSendSpy.lastCall.args[0]).to.equal('thankyou');
              expect(emailSendSpy.lastCall.args[1]).to.equal(user2.email);
              done();
            }, 80);
          });
        });
      });
    });
  });
});