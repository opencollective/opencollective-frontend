import _ from 'lodash';
import { expect } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import chanceLib from 'chance';
import request from 'supertest';
import app from '../server/index';
import * as utils from '../test/utils';
import paymentsLib from '../server/lib/payments';
import { planId as generatePlanId } from '../server/lib/utils.js';
import * as constants from '../server/constants/transactions';
import emailLib from '../server/lib/email';
import roles from '../server/constants/roles';
import models from '../server/models';
import {appStripe} from '../server/gateways/stripe';

const chance = chanceLib.Chance();
const application = utils.data('application');
const userData = utils.data('user3');
const userData2 = utils.data('user2');
const groupData = utils.data('group5');
import stripeMock from './mocks/stripe';
const STRIPE_URL = 'https://api.stripe.com:443';
const CHARGE = 10.99;
const CURRENCY = 'EUR';
const STRIPE_TOKEN = 'superStripeToken';

/*
 * Tests
 */
describe('lib.payments.processPayment.test.js', () => {
  let user, user2, group, sandbox, processPaymentSpy, emailSendSpy;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  before(() => {
    processPaymentSpy = sinon.spy(paymentsLib, 'processPayment');
  });

  beforeEach(() => {
    emailSendSpy = sandbox.spy(emailLib, 'send');
  });

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => processPaymentSpy.reset());

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  // Create a user.
  beforeEach('create a user', () => models.User.create(userData).tap(u => user = u));

  // Create a user.
  beforeEach('create a user', () => models.User.create(userData2).tap(u => user2 = u));

  // Create a group.
  beforeEach('create a group', (done) => {
    request(app)
      .post('/groups')
      .send({
        api_key: application.api_key,
        group: Object.assign(groupData, { users: [{ email: 'member@group.com', role: roles.MEMBER}] })
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

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  after(() => processPaymentSpy.restore());

  describe('No payment method', () => {
    let donation;

    describe('Donation given by the host', () => {

      beforeEach(() => {
        return models.Donation.create({
          amount: 10000,
          currency: 'USD',
          UserId: user.id,
          GroupId: group.id
        })
        .then(d => donation = d)
        .then(paymentsLib.processPayment)
        .catch(err => expect(err).to.not.exist);
      });

      it('creates a transaction', () => {
        return models.Transaction.findAll()
        .then(transactions => {
          expect(transactions.length).to.equal(1);
          expect(transactions[0]).to.contain({
            type: constants.type.DONATION,
            DonationId: donation.id,
            amount: donation.amount,
            currency: donation.currency,
            txnCurrency: donation.currency,
            amountInTxnCurrency: donation.amount,
            txnCurrencyFxRate: 1,
            platformFeeInTxnCurrency: 0,
            paymentProcessorFeeInTxnCurrency: 0,
            hostFeeInTxnCurrency: 0
          })
        })
      });

      it('isProcessed and processedAt should not be false and null', () => {
        return models.Donation.findById(donation.id)
        .then(donation => {
          expect(donation.isProcessed).to.equal(true);
          expect(donation.processedAt).to.not.equal(null);
        })
      });
    });

    describe('Donation given by another user', () => {
      beforeEach(() => {
        return models.Donation.create({
          amount: 10000,
          currency: 'USD',
          UserId: user2.id,
          GroupId: group.id
        })
        .then(d => donation = d)
        .then(paymentsLib.processPayment)
        .catch(err => expect(err).to.not.exist);
      });

      it('creates a transaction', () => {
        return models.Transaction.findAll()
        .then(transactions => {
          expect(transactions.length).to.equal(1);
          expect(transactions[0]).to.contain({
            type: constants.type.DONATION,
            DonationId: donation.id,
            amount: donation.amount,
            currency: donation.currency,
            txnCurrency: donation.currency,
            amountInTxnCurrency: donation.amount,
            txnCurrencyFxRate: 1,
            platformFeeInTxnCurrency: 0,
            paymentProcessorFeeInTxnCurrency: 0,
            hostFeeInTxnCurrency: 500
          })
        })
      });

      it('adds the user as a backer', () => {
        return models.UserGroup.findOne({
          where: {
            UserId: user2.id,
            GroupId: group.id,
            role: roles.BACKER
          }
        })
        .then(userGroup => {
          expect(userGroup).to.exist;
        });
      });

      it('isProcessed and processedAt should not be false and null', () => {
        return models.Donation.findById(donation.id)
        .then(donation => {
          expect(donation.isProcessed).to.equal(true);
          expect(donation.processedAt).to.not.equal(null);
        });
      });

    });
  });

  describe('Paypal payment method', () => {
    beforeEach('create a payment method', () => {
      return models.PaymentMethod.create({
        number: 'blah',
        token: 'token-xxx',
        service: 'paypal'
        })
      .then(pm => models.Donation.create({
        amount: 100,
        currency: 'USD',
        SubscriptionId: null,
        PaymentMethodId: pm.id
      }))
      .then(paymentsLib.processPayment);
    });

    it('isProcessed and processedAt should not be false and null', done => {
      models.Donation.findById(1)
        .then(donation => {
          expect(donation.isProcessed).to.equal(true);
          expect(donation.processedAt).to.not.equal(null);
          done();
        })
    });
  });

  describe('Stripe', () => {

    const nocks = {};

    const stubStripe = () => {
      const mock = stripeMock.accounts.create;
      mock.email = chance.email();

      const stub = sinon.stub(appStripe.accounts, 'create');
      stub.yields(null, mock);
    };

    // Nock for customers.create.
    beforeEach(() => {
      nocks['customers.create'] = nock(STRIPE_URL)
        .post('/v1/customers')
        .reply(200, stripeMock.customers.create);
    });

    // Nock for retrieving balance transaction
    beforeEach(() => {
      nocks['balance.retrieveTransaction'] = nock(STRIPE_URL)
        .get('/v1/balance/history/txn_165j8oIqnMN1wWwOKlPn1D4y')
        .reply(200, stripeMock.balance);
    });

    beforeEach(() => {
      stubStripe();
    });

    beforeEach((done) => {
      models.StripeAccount.create({
        accessToken: 'abc'
      })
      .then((account) => user.setStripeAccount(account))
      .tap(() => done())
      .catch(done);
    });

    // Nock for charges.create.
    beforeEach(() => {
      const params = [
        `amount=${CHARGE * 100}`,
        `currency=${CURRENCY}`,
        `customer=${stripeMock.customers.create.id}`,
        `description=${encodeURIComponent(`OpenCollective: ${group.slug}`)}`,
        'application_fee=54',
        `${encodeURIComponent('metadata[groupId]')}=${group.id}`,
        `${encodeURIComponent('metadata[groupName]')}=${encodeURIComponent(groupData.name)}`,
        `${encodeURIComponent('metadata[customerEmail]')}=${encodeURIComponent(user.email)}`,
        `${encodeURIComponent('metadata[paymentMethodId]')}=1`
      ].join('&');

      nocks['charges.create'] = nock(STRIPE_URL)
        .post('/v1/charges', params)
        .reply(200, stripeMock.charges.create);
    });

    afterEach(() => {
      appStripe.accounts.create.restore();
      nock.cleanAll();
    });

    describe('One-time donation', () => {
      beforeEach('create related groups', () => models.Group.createMany(utils.data('relatedGroups')));

      beforeEach('create a payment method and a donation', () => {
        return models.PaymentMethod.create({
          number: 'blah',
          token: STRIPE_TOKEN,
          service: 'stripe'
        })
        .tap(pm => models.Donation.create({
          amount: CHARGE * 100,
          currency: CURRENCY,
          SubscriptionId: null,
          PaymentMethodId: pm.id,
          UserId: user.id,
          GroupId: group.id
        }))
        .then(paymentsLib.processPayment)
        .then(transaction => {
          expect(transaction.type).to.equal(constants.type.DONATION);
          expect(transaction.currency).to.equal(CURRENCY);
        });
      });

      it('successfully creates a Stripe customer', () => {
        expect(nocks['customers.create'].isDone()).to.be.true;
      });

      it('successfully makes a Stripe charge', () => {
        expect(nocks['charges.create'].isDone()).to.be.true;
      });

      it('successfully gets a Stripe balance', () => {
        expect(nocks['balance.retrieveTransaction'].isDone()).to.be.true;
      });

      it('successfully creates a transaction in the database', (done) => {
        models.Transaction
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('PaymentMethodId', 1);
            expect(res.rows[0]).to.have.property('currency', CURRENCY);
            expect(res.rows[0]).to.have.property('type', constants.type.DONATION);
            expect(res.rows[0]).to.have.property('amount', CHARGE*100);
            expect(res.rows[0]).to.have.property('amountInTxnCurrency', 140000); // taken from stripe mocks
            expect(res.rows[0]).to.have.property('txnCurrency', 'USD');
            expect(res.rows[0]).to.have.property('hostFeeInTxnCurrency', 7000);
            expect(res.rows[0]).to.have.property('platformFeeInTxnCurrency', 7000);
            expect(res.rows[0]).to.have.property('paymentProcessorFeeInTxnCurrency', 15500);
            expect(res.rows[0]).to.have.property('txnCurrencyFxRate', 0.00785);
            expect(res.rows[0]).to.have.property('netAmountInGroupCurrency', 867)
            done();
          })
          .catch(done);
      });

      it('successfully adds the user as a backer', (done) => {
        group
          .getUsers()
          .then((users) => {
            expect(users).to.have.length(3);
            const backer = _.find(users, {email: user.email});
            expect(backer.UserGroup.role).to.equal(roles.BACKER);
            done();
          })
          .catch(done);
      });

      it('successfully sends out an email to donor', () => {
        expect(emailSendSpy.args[1][0]).to.equal('thankyou');
        expect(emailSendSpy.args[1][1]).to.equal(user.email);
        expect(emailSendSpy.args[1][2].relatedGroups).to.have.length(2);
        expect(emailSendSpy.args[1][2].relatedGroups[0]).to.have.property('settings');
      });
    });

    describe('Recurring donation', () => {

      const customerId = stripeMock.customers.create.id;

      const createDonation = (interval) => {
        let pm;
        return models.PaymentMethod.create({
          number: 'blah',
          token: STRIPE_TOKEN,
          service: 'stripe'
          })
        .tap(paymentMethod => pm = paymentMethod)
        .then(() => models.Subscription.create({
          interval,
          currency: CURRENCY,
          amount: 10.99
        }))
        .then(subscription => models.Donation.create({
          amount: 1099,
          currency: CURRENCY,
          SubscriptionId: subscription.id,
          PaymentMethodId: pm.id,
          UserId: user.id,
          GroupId: group.id,
          createdAt: '2017-01-22T15:01:22.827-07:00'
        }))
        .then(paymentsLib.processPayment);
      };

      describe('monthly', () => {
        const planId = generatePlanId({
          currency: CURRENCY,
          interval: 'month',
          amount: 1099
        });

        const plan = _.extend({}, stripeMock.plans.create, {
          amount: 1099,
          interval: 'month',
          name: planId,
          id: planId
        });

        beforeEach(() => {
          const params = [
            `plan=${planId}`,
            'application_fee_percent=5',
            'trial_end=1485986482',
            `${encodeURIComponent('metadata[groupId]')}=${group.id}`,
            `${encodeURIComponent('metadata[groupName]')}=${encodeURIComponent(group.name)}`,
            `${encodeURIComponent('metadata[paymentMethodId]')}=1`,
            `${encodeURIComponent('metadata[description]')}=${encodeURIComponent(`https://opencollective.com/${group.slug}`)}`
          ].join('&');

          nocks['subscriptions.create'] = nock(STRIPE_URL)
            .post(`/v1/customers/${customerId}/subscriptions`, params)
            .reply(200, stripeMock.subscriptions.create);
        });

        beforeEach(() => {
          nocks['plans.create'] = nock(STRIPE_URL)
            .post('/v1/plans')
            .reply(200, plan);
        });

        describe('plan does not exist', () => {

          beforeEach(() => {
            nocks['plans.retrieve'] = nock(STRIPE_URL)
              .get(`/v1/plans/${planId}`)
              .reply(200, {
                error: stripeMock.plans.create_not_found
              });
          });

          beforeEach(() => createDonation('month'));
        
          it('successfully creates a Stripe customer', () => {
            expect(nocks['customers.create'].isDone()).to.be.true;
          });

          it('successfully makes a Stripe charge', () => {
            expect(nocks['charges.create'].isDone()).to.be.true;
          });

          it('successfully gets a Stripe balance', () => {
            expect(nocks['balance.retrieveTransaction'].isDone()).to.be.true;
          });

          it('successfully creates a transaction in the database', (done) => {
            models.Transaction
              .findAndCountAll({})
              .then((res) => {
                expect(res.count).to.equal(1);
                expect(res.rows[0]).to.have.property('UserId', user.id);
                expect(res.rows[0]).to.have.property('PaymentMethodId', 1);
                expect(res.rows[0]).to.have.property('currency', CURRENCY);
                expect(res.rows[0]).to.have.property('type', constants.type.DONATION);
                expect(res.rows[0]).to.have.property('amount', CHARGE*100);
                expect(res.rows[0]).to.have.property('amountInTxnCurrency', 140000); // taken from stripe mocks
                expect(res.rows[0]).to.have.property('txnCurrency', 'USD');
                expect(res.rows[0]).to.have.property('hostFeeInTxnCurrency', 7000);
                expect(res.rows[0]).to.have.property('platformFeeInTxnCurrency', 7000);
                expect(res.rows[0]).to.have.property('paymentProcessorFeeInTxnCurrency', 15500);
                expect(res.rows[0]).to.have.property('txnCurrencyFxRate', 0.00785);
                expect(res.rows[0]).to.have.property('netAmountInGroupCurrency', 867)
                done();
              })
              .catch(done);
          });

          it('creates a plan', () => {
            expect(nocks['plans.retrieve'].isDone()).to.be.true;
            expect(nocks['plans.create'].isDone()).to.be.true;
          });

          it('creates a subscription', () => {
            expect(nocks['subscriptions.create'].isDone()).to.be.true;
          });

          it('successfully adds the user as a backer', (done) => {
            group
              .getUsers()
              .then((users) => {
                expect(users).to.have.length(3);
                const backer = _.find(users, {email: user.email});
                expect(backer.UserGroup.role).to.equal(roles.BACKER);
                done();
              })
              .catch(done);
          });
        });

        describe('plan exists', () => {
          beforeEach(() => {
            nocks['plans.retrieve'] = nock(STRIPE_URL)
              .get(`/v1/plans/${planId}`)
              .reply(200, plan);
          });

          beforeEach(() => createDonation('month'));

          it('successfully creates a Stripe customer', () => {
            expect(nocks['customers.create'].isDone()).to.be.true;
          });

          it('successfully makes a Stripe charge', () => {
            expect(nocks['charges.create'].isDone()).to.be.true;
          });

          it('successfully gets a Stripe balance', () => {
            expect(nocks['balance.retrieveTransaction'].isDone()).to.be.true;
          });

          it('successfully creates a transaction in the database', (done) => {
            models.Transaction
              .findAndCountAll({})
              .then((res) => {
                expect(res.count).to.equal(1);
                expect(res.rows[0]).to.have.property('UserId', user.id);
                expect(res.rows[0]).to.have.property('PaymentMethodId', 1);
                expect(res.rows[0]).to.have.property('currency', CURRENCY);
                expect(res.rows[0]).to.have.property('type', constants.type.DONATION);
                expect(res.rows[0]).to.have.property('amount', CHARGE*100);
                expect(res.rows[0]).to.have.property('amountInTxnCurrency', 140000); // taken from stripe mocks
                expect(res.rows[0]).to.have.property('txnCurrency', 'USD');
                expect(res.rows[0]).to.have.property('hostFeeInTxnCurrency', 7000);
                expect(res.rows[0]).to.have.property('platformFeeInTxnCurrency', 7000);
                expect(res.rows[0]).to.have.property('paymentProcessorFeeInTxnCurrency', 15500);
                expect(res.rows[0]).to.have.property('txnCurrencyFxRate', 0.00785);
                expect(res.rows[0]).to.have.property('netAmountInGroupCurrency', 867)
                done();
              })
              .catch(done);
          });

          it('uses the existing plan', () => {
            expect(nocks['plans.create'].isDone()).to.be.false;
            expect(nocks['plans.retrieve'].isDone()).to.be.true;
          });

          it('creates a subscription', () => {
            expect(nocks['subscriptions.create'].isDone()).to.be.true;
          });

          it('successfully adds the user as a backer', (done) => {
            group
              .getUsers()
              .then((users) => {
                expect(users).to.have.length(3);
                const backer = _.find(users, {email: user.email});
                expect(backer.UserGroup.role).to.equal(roles.BACKER);
                done();
              })
              .catch(done);
          });

          it('successfully sends out an email to donor', () => {
            expect(emailSendSpy.lastCall.args[0]).to.equal('thankyou');
            expect(emailSendSpy.lastCall.args[1]).to.equal(user.email);
          });
        });
      });

      describe('annually', () => {
        const planId = generatePlanId({
          currency: CURRENCY,
          interval: 'year',
          amount: 1099
        });

        const plan = _.extend({}, stripeMock.plans.create, {
          amount: 1099,
          interval: 'year',
          name: planId,
          id: planId
        });

        beforeEach(() => {
          const params = [
            `plan=${planId}`,
            'application_fee_percent=5',
            'trial_end=1514844082',
            `${encodeURIComponent('metadata[groupId]')}=${group.id}`,
            `${encodeURIComponent('metadata[groupName]')}=${encodeURIComponent(group.name)}`,
            `${encodeURIComponent('metadata[paymentMethodId]')}=1`,
            `${encodeURIComponent('metadata[description]')}=${encodeURIComponent(`https://opencollective.com/${group.slug}`)}`
          ].join('&');

          nocks['subscriptions.create'] = nock(STRIPE_URL)
            .post(`/v1/customers/${customerId}/subscriptions`, params)
            .reply(200, stripeMock.subscriptions.create);
        });

        beforeEach(() => {
          nocks['plans.create'] = nock(STRIPE_URL)
            .post('/v1/plans')
            .reply(200, plan);
        });

        describe('plan does not exist', () => {

          beforeEach(() => {
            nocks['plans.retrieve'] = nock(STRIPE_URL)
              .get(`/v1/plans/${planId}`)
              .reply(200, {
                error: stripeMock.plans.create_not_found
              });
          });

          beforeEach(() => createDonation('year'));
        
          it('successfully creates a Stripe customer', () => {
            expect(nocks['customers.create'].isDone()).to.be.true;
          });

          it('successfully makes a Stripe charge', () => {
            expect(nocks['charges.create'].isDone()).to.be.true;
          });

          it('successfully gets a Stripe balance', () => {
            expect(nocks['balance.retrieveTransaction'].isDone()).to.be.true;
          });

          it('successfully creates a transaction in the database', (done) => {
            models.Transaction
              .findAndCountAll({})
              .then((res) => {
                expect(res.count).to.equal(1);
                expect(res.rows[0]).to.have.property('UserId', user.id);
                expect(res.rows[0]).to.have.property('PaymentMethodId', 1);
                expect(res.rows[0]).to.have.property('currency', CURRENCY);
                expect(res.rows[0]).to.have.property('type', constants.type.DONATION);
                expect(res.rows[0]).to.have.property('amount', CHARGE*100);
                expect(res.rows[0]).to.have.property('amountInTxnCurrency', 140000); // taken from stripe mocks
                expect(res.rows[0]).to.have.property('txnCurrency', 'USD');
                expect(res.rows[0]).to.have.property('hostFeeInTxnCurrency', 7000);
                expect(res.rows[0]).to.have.property('platformFeeInTxnCurrency', 7000);
                expect(res.rows[0]).to.have.property('paymentProcessorFeeInTxnCurrency', 15500);
                expect(res.rows[0]).to.have.property('txnCurrencyFxRate', 0.00785);
                expect(res.rows[0]).to.have.property('netAmountInGroupCurrency', 867)
                done();
              })
              .catch(done);
          });

          it('creates a plan', () => {
            expect(nocks['plans.retrieve'].isDone()).to.be.true;
            expect(nocks['plans.create'].isDone()).to.be.true;
          });

          it('creates a subscription', () => {
            expect(nocks['subscriptions.create'].isDone()).to.be.true;
          });

          it('successfully adds the user as a backer', (done) => {
            group
              .getUsers()
              .then((users) => {
                expect(users).to.have.length(3);
                const backer = _.find(users, {email: user.email});
                expect(backer.UserGroup.role).to.equal(roles.BACKER);
                done();
              })
              .catch(done);
          });
        });

        describe('plan exists', () => {
          beforeEach(() => {
            nocks['plans.retrieve'] = nock(STRIPE_URL)
              .get(`/v1/plans/${planId}`)
              .reply(200, plan);
          });

          beforeEach(() => createDonation('year'));

          it('successfully creates a Stripe customer', () => {
            expect(nocks['customers.create'].isDone()).to.be.true;
          });

          it('successfully makes a Stripe charge', () => {
            expect(nocks['charges.create'].isDone()).to.be.true;
          });

          it('successfully gets a Stripe balance', () => {
            expect(nocks['balance.retrieveTransaction'].isDone()).to.be.true;
          });

          it('successfully creates a transaction in the database', (done) => {
            models.Transaction
              .findAndCountAll({})
              .then((res) => {
                expect(res.count).to.equal(1);
                expect(res.rows[0]).to.have.property('UserId', user.id);
                expect(res.rows[0]).to.have.property('PaymentMethodId', 1);
                expect(res.rows[0]).to.have.property('currency', CURRENCY);
                expect(res.rows[0]).to.have.property('type', constants.type.DONATION);
                expect(res.rows[0]).to.have.property('amount', CHARGE*100);
                expect(res.rows[0]).to.have.property('amountInTxnCurrency', 140000); // taken from stripe mocks
                expect(res.rows[0]).to.have.property('txnCurrency', 'USD');
                expect(res.rows[0]).to.have.property('hostFeeInTxnCurrency', 7000);
                expect(res.rows[0]).to.have.property('platformFeeInTxnCurrency', 7000);
                expect(res.rows[0]).to.have.property('paymentProcessorFeeInTxnCurrency', 15500);
                expect(res.rows[0]).to.have.property('txnCurrencyFxRate', 0.00785);
                expect(res.rows[0]).to.have.property('netAmountInGroupCurrency', 867)
                done();
              })
              .catch(done);
          });

          it('uses the existing plan', () => {
            expect(nocks['plans.create'].isDone()).to.be.false;
            expect(nocks['plans.retrieve'].isDone()).to.be.true;
          });

          it('creates a subscription', () => {
            expect(nocks['subscriptions.create'].isDone()).to.be.true;
          });

          it('successfully adds the user as a backer', (done) => {
            group
              .getUsers()
              .then((users) => {
                expect(users).to.have.length(3);
                const backer = _.find(users, {email: user.email});
                expect(backer.UserGroup.role).to.equal(roles.BACKER);
                done();
              })
              .catch(done);
          });

          it('successfully sends out an email to donor', () => {
            expect(emailSendSpy.lastCall.args[0]).to.equal('thankyou');
            expect(emailSendSpy.lastCall.args[1]).to.equal(user.email);
          });
        });
      });


    });

  });
});
