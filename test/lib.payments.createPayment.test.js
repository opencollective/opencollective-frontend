import { expect } from 'chai';
import sinon from 'sinon';

import models from '../server/models';
import * as utils from '../test/utils';
import paymentsLib from '../server/lib/payments';
import roles from '../server/constants/roles';

const AMOUNT = 1099;
const AMOUNT2 = 199;
const CURRENCY = 'EUR';
const STRIPE_TOKEN = 'superStripeToken';
const EMAIL = 'anotheruser@email.com';
const userData = utils.data('user3');

describe('lib.payments.createPayment.test.js', () => {
  let host, user, user2, collective, order, collective2, sandbox;

  before(() => sandbox = sinon.sandbox.create());

  after(() => sandbox.restore());

  beforeEach(() => sandbox.stub(paymentsLib, 'processPayment'));

  beforeEach(() => utils.resetTestDB());

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  beforeEach('create a user', () => models.User.create(userData).tap(u => user = u));
  beforeEach('create a user', () => models.User.create({email: EMAIL}).tap(u => user2 = u));
  beforeEach('create a host', () => models.User.create(utils.data('host1')).tap(u => host = u));
  beforeEach('create a collective', () => models.Collective.create(utils.data('collective1')).tap(g => collective = g));
  beforeEach('create a collective', () => models.Collective.create(utils.data('collective2')).tap(g => collective2 = g));
  beforeEach('create an order', () => models.Order.create({
    UserId: user.id,
    CollectiveId: collective.id,
    amount: AMOUNT,
    currency: CURRENCY
  }).tap(t => order = t))
  beforeEach('add user to collective as member', () => collective.addUserWithRole(host, roles.HOST));
  beforeEach('add user to collective2 as member', () => collective2.addUserWithRole(host, roles.HOST));

  beforeEach('create stripe account', (done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => host.setStripeAccount(account))
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

      it('stripe token is missing', () => {
        return paymentsLib.createPayment({ 
          order,
          payment: {
            amount: AMOUNT, 
            currency: CURRENCY,
          }})
        .catch(err => expect(err.message).to.equal('Stripe Token missing.'));
      });

      it('interval is present and it is not month or year', () => {
        return paymentsLib.createPayment({ 
          order,
          payment: {
            amount: AMOUNT, 
            currency: CURRENCY,
            paymentMethod: { token: STRIPE_TOKEN },
            interval: 'something'
          }})
        .catch(err => expect(err.message).to.equal('Interval should be month or year.'));
      });

      it('payment amount is missing', () => {
        return paymentsLib.createPayment({ 
          order,
          payment: {
            currency: CURRENCY,
            paymentMethod: { token: STRIPE_TOKEN },
          }})
        .catch(err => expect(err.message).to.equal('Payment amount missing'));
      });

      it('payment amount is less than 50', () => {
        return paymentsLib.createPayment({ 
          order,
          payment: {
            currency: CURRENCY,
            paymentMethod: { token: STRIPE_TOKEN },
            amount: 35
          }})
        .catch(err => expect(err.message).to.equal('Payment amount must be at least $0.50'));
      });
    });

    describe('and when payload looks good', () => {

      describe('it fails', () => {

        it('if no stripe account', () => {
          return user.setStripeAccount(null)
          .then(() => paymentsLib.createPayment({
            order,
            payment: {
              paymentMethod: { token: STRIPE_TOKEN },
              amount: AMOUNT,
              currency: CURRENCY
            }
          }))
          .catch(err => expect(err.message).to.equal('The host for the collective slug wwcode-austin has no Stripe account set up'))

        });

        it('if stripe has live key and not in production', () => {
          return models.StripeAccount.create({ accessToken: 'sk_live_abc'})
          .then((account) => user.setStripeAccount(account))
          .then(() => paymentsLib.createPayment({
            order,
            payment: {
              paymentMethod: { token: STRIPE_TOKEN },
              amount: AMOUNT,
              currency: CURRENCY
            }
          }))
          .catch(err => expect(err.message).to.contain('You can\'t use a Stripe live key'));
        });
      });

      describe('and payment succeeds', () => {

        describe('one-time', () => {

          describe('1st payment', () => {
            
            beforeEach(() => paymentsLib.createPayment({
              order,
              payment: {
                paymentMethod: { token: STRIPE_TOKEN },
                amount: AMOUNT,
                currency: CURRENCY,
              }
            }));

            it('successfully creates a paymentMethod with the UserId', (done) => {
              models.PaymentMethod
                .findAndCountAll({})
                .then((res) => {
                  expect(res.count).to.equal(1);
                  expect(res.rows[0]).to.have.property('UserId', user.id);
                  expect(res.rows[0]).to.have.property('token', STRIPE_TOKEN);
                  expect(res.rows[0]).to.have.property('service', 'stripe');
                  done();
                })
                .catch(done);
            });

            it('successfully creates an order in the database', (done) => {
              models.Order
                .findAndCountAll({})
                .then((res) => {
                  expect(res.count).to.equal(1);
                  expect(res.rows[0]).to.have.property('UserId', user.id);
                  expect(res.rows[0]).to.have.property('CollectiveId', collective.id);
                  expect(res.rows[0]).to.have.property('currency', CURRENCY);
                  expect(res.rows[0]).to.have.property('amount', AMOUNT);
                  expect(res.rows[0]).to.have.property('description',
                    `Donation to ${collective.name}`);
                  done();
                })
                .catch(done);
            });
          });

          describe('2nd payment with same stripeToken', () => {
            
            beforeEach('create first payment', () => paymentsLib.createPayment({
              order,
              payment: {
                paymentMethod: { token: STRIPE_TOKEN },
                amount: AMOUNT,
                currency: CURRENCY,
              }
            }));

            beforeEach('create 2nd payment', () => models.PaymentMethod
              .findOne()
              .then(paymentMethod => paymentsLib.createPayment({
                order,
                payment: {
                  paymentMethod,
                  amount: AMOUNT2,
                  currency: CURRENCY,
                }
              }
            )));

            it('does not re-create a paymentMethod', (done) => {
              models.PaymentMethod
                .findAndCountAll({})
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

          beforeEach(() => models.Order.create({
            UserId: user2.id,
            CollectiveId: collective2.id,
            amount: AMOUNT2,
            currency: collective2.currency
          }).then(o => order2 = o))

          beforeEach(() => {
            return paymentsLib.createPayment({
              order: order2,
              payment: {
                paymentMethod: { token: STRIPE_TOKEN },
                amount: AMOUNT2,
                currency: CURRENCY,
                interval: 'month'
              }
            });
          });

          it('successfully creates a paymentMethod', (done) => {
            models.PaymentMethod
              .findAndCountAll({})
              .then((res) => {
                expect(res.count).to.equal(1);
                expect(res.rows[0]).to.have.property('UserId', user2.id);
                done();
              })
              .catch(done);
          });

          it('successfully creates an order in the database', (done) => {
            models.Order
              .findAndCountAll({})
              .then((res) => {
                expect(res.count).to.equal(2);
                expect(res.rows[1]).to.have.property('UserId', user2.id);
                expect(res.rows[1]).to.have.property('CollectiveId', collective2.id);
                expect(res.rows[1]).to.have.property('currency', CURRENCY);
                expect(res.rows[1]).to.have.property('amount', AMOUNT2);
                expect(res.rows[1]).to.have.property('SubscriptionId');
                expect(res.rows[1]).to.have.property('description', `Monthly donation to ${collective2.name}`);
                done();
              })
              .catch(done)
          });

          it('does not create a transaction', (done) => {
            models.Transaction
              .count({})
              .then((res) => {
                expect(res).to.equal(0);
                done();
              })
              .catch(done);
          });

          it('creates a Subscription model', (done) => {
            models.Subscription
              .findAndCountAll({})
              .then((res) => {
                const subscription = res.rows[0];

                expect(res.count).to.equal(1);
                expect(subscription).to.have.property('amount', AMOUNT2);
                expect(subscription).to.have.property('interval', 'month');
                expect(subscription).to.have.property('data');
                expect(subscription).to.have.property('isActive', false);
                expect(subscription).to.have.property('currency', CURRENCY);
                done();
              })
              .catch(done);
          });
        });
      });
    });
  });
});