import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';

import models from '../server/models';
import * as utils from '../test/utils';
import * as paymentsLib from '../server/lib/payments';
import roles from '../server/constants/roles';

const AMOUNT = 1099;
const AMOUNT2 = 199;
const CURRENCY = 'EUR';
const STRIPE_TOKEN = 'superStripeToken';
const EMAIL = 'anotheruser@email.com';
const application = utils.data('application');
const userData = utils.data('user3');
const groupData = utils.data('group2');

describe('lib.createPayment.test.js', () => {
  let user, user2, group, group2, sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(paymentsLib, 'processPayment');
  });

  beforeEach(() => utils.resetTestDB());

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  beforeEach('create a user', () => models.User.create(userData).tap(u => user = u));
  beforeEach('create a user', () => models.User.create({email: EMAIL}).tap(u => user2 = u));

  beforeEach('create group with user as first member', (done) => {
    request(app)
      .post('/groups')
      .send({
        api_key: application.api_key,
        group: Object.assign(groupData, { users: [{ email: user.email, role: roles.HOST}]})
      })
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        models.Group
          .findById(parseInt(res.body.id))
          .then((g) => {
            group = g;
            done();
          })
          .catch(done);
      });
  });

  beforeEach('create second group with user as first member', (done) => {
    request(app)
      .post('/groups')
      .send({
        api_key: application.api_key,
        group: Object.assign(utils.data('group1'), { users: [{ email: user.email, role: roles.HOST}]}),
        role: roles.HOST
      })
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        models.Group
          .findById(parseInt(res.body.id))
          .tap((g) => {
            group2 = g;
            done();
          })
          .catch(done);
      });
  });

  beforeEach('create stripe account', (done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => user.setStripeAccount(account))
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
          user, 
          group, 
          payment: {
            amount: AMOUNT, 
            currency: CURRENCY,
          }})
        .catch(err => expect(err.message).to.equal('Stripe Token missing.'));
      });

      it('interval is present and it is not month or year', () => {
        return paymentsLib.createPayment({ 
          user, 
          group, 
          payment: {
            amount: AMOUNT, 
            currency: CURRENCY,
            token: STRIPE_TOKEN,
            interval: 'something'
          }})
        .catch(err => expect(err.message).to.equal('Interval should be month or year.'));
      });

      it('payment amount is missing', () => {
        return paymentsLib.createPayment({ 
          user, 
          group, 
          payment: {
            currency: CURRENCY,
            token: STRIPE_TOKEN,
          }})
        .catch(err => expect(err.message).to.equal('Payment amount missing'));
      });

      it('payment amount is less than 50', () => {
        return paymentsLib.createPayment({ 
          user, 
          group, 
          payment: {
            currency: CURRENCY,
            token: STRIPE_TOKEN,
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
            user,
            group,
            payment: {
              token: STRIPE_TOKEN,
              amount: AMOUNT,
              currency: CURRENCY
            }
          }))
          .catch(err => expect(err.message).to.equal('The host for the collective slug wwcode-austin has no Stripe account set up'))

        });

        it('if stipe has live key and not in production', () => {
          return models.StripeAccount.create({ accessToken: 'sk_live_abc'})
          .then((account) => user.setStripeAccount(account))
          .then(() => paymentsLib.createPayment({
            user,
            group,
            payment: {
              token: STRIPE_TOKEN,
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
              user,
              group,
              payment: {
                token: STRIPE_TOKEN,
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

            it('successfully creates a donation in the database', (done) => {
              models.Donation
                .findAndCountAll({})
                .then((res) => {
                  expect(res.count).to.equal(1);
                  expect(res.rows[0]).to.have.property('UserId', user.id);
                  expect(res.rows[0]).to.have.property('GroupId', group.id);
                  expect(res.rows[0]).to.have.property('currency', CURRENCY);
                  expect(res.rows[0]).to.have.property('amount', AMOUNT);
                  expect(res.rows[0]).to.have.property('title',
                    `Donation to ${group.name}`);
                  done();
                })
                .catch(done);
            });
          });

          describe('2nd payment with same stripeToken', () => {
            
            beforeEach(() => paymentsLib.createPayment({
              user,
              group,
              payment: {
                token: STRIPE_TOKEN,
                amount: AMOUNT,
                currency: CURRENCY,
              }
            }));

            beforeEach(() => {
              return paymentsLib.createPayment({
                user,
                group,
                payment: {
                  token: STRIPE_TOKEN,
                  amount: AMOUNT2,
                  currency: CURRENCY,
                }
              });
            });

            it('does not re-create a paymentMethod', (done) => {
              models.PaymentMethod
                .findAndCountAll({})
                .then((res) => {
                  expect(res.count).to.equal(1);
                  done();
                })
                .catch(done);
            });

            it('successfully creates a donation in the database', (done) => {
              models.Donation
                .findAndCountAll({})
                .then((res) => {
                  expect(res.count).to.equal(2);
                  expect(res.rows[1]).to.have.property('amount', AMOUNT2);
                  done();
                })
                .catch(done);
            });
          });

        });

        describe('recurringly', () => {

          beforeEach(() => {
            return paymentsLib.createPayment({
              user: user2,
              group: group2,
              payment: {
                token: STRIPE_TOKEN,
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

          it('successfully creates a donation in the database', (done) => {
            models.Donation
              .findAndCountAll({})
              .then((res) => {
                expect(res.count).to.equal(1);
                expect(res.rows[0]).to.have.property('UserId', user2.id);
                expect(res.rows[0]).to.have.property('GroupId', group2.id);
                expect(res.rows[0]).to.have.property('currency', CURRENCY);
                expect(res.rows[0]).to.have.property('amount', AMOUNT2);
                expect(res.rows[0]).to.have.property('SubscriptionId');
                expect(res.rows[0]).to.have.property('title', `Monthly donation to ${group2.name}`);
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