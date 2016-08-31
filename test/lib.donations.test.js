import _ from 'lodash';
import { expect } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import chanceLib from 'chance';
import request from 'supertest';
import app from '../server/index';
import * as utils from '../test/utils';
import * as donationsLib from '../server/lib/donations';
import { planId as generatePlanId } from '../server/lib/utils.js';
import * as constants from '../server/constants/transactions';
import emailLib from '../server/lib/email';
import roles from '../server/constants/roles';
import models from '../server/models';
import {appStripe} from '../server/gateways/stripe';

const chance = chanceLib.Chance();
const userData = utils.data('user3');
const groupData = utils.data('group2');
import stripeMock from './mocks/stripe';
const STRIPE_URL = 'https://api.stripe.com:443';
const CHARGE = 10.99;
const CURRENCY = 'EUR';
const STRIPE_TOKEN = 'superStripeToken';

/*
 * Tests
 */
describe('lib.donation.test.js', () => {

  const sandbox = sinon.sandbox.create();
  let processDonationSpy, emailSendMessageSpy, emailSendSpy;
  let application;

  before(() => {
    processDonationSpy = sinon.spy(donationsLib, 'processDonation');
  });

  beforeEach(() => {
    emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage', () => Promise.resolve());
  });

  beforeEach(() => {
    emailSendSpy = sandbox.spy(emailLib, 'send');
  });

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  beforeEach(() => processDonationSpy.reset());

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  after(() => processDonationSpy.restore());

  describe('No payment method', () => {
    beforeEach(() => {
      return models.Donation.create({
        amount: 100,
        currency: 'USD',
        SubscriptionId: null,
        PaymentMethodId: null
      })
    });

    it('isProcessed and processedAt should not be false and null', done => {
      models.Donation.findById(1)
        .then(donation => {
          expect(donation.isProcessed).to.equal(true);
          expect(donation.processedAt).to.not.equal(null);
          done();
        })
    })
  });

  describe('Paypal payment method', () => {
    beforeEach(() => {
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
      }));
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

    let user, application2, group, group2;
    const nocks = {};

    const stubStripe = () => {
      const mock = stripeMock.accounts.create;
      mock.email = chance.email();

      const stub = sinon.stub(appStripe.accounts, 'create');
      stub.yields(null, mock);
    };

    // Create a user.
    beforeEach(() => models.User.create(userData).tap(u => user = u));

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

    // Create a group.
    beforeEach((done) => {
      request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .send({
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

    beforeEach(() => {
      stubStripe();
    });

    // Create a second group.
    beforeEach((done) => {
      request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .send({
          group: utils.data('group1'),
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

    beforeEach((done) => {
      models.StripeAccount.create({
        accessToken: 'abc'
      })
      .then((account) => user.setStripeAccount(account))
      .tap(() => done())
      .catch(done);
    });

    // Create an application which has only access to `group`
    beforeEach(() => models.Application.create(utils.data('application2'))
      .tap(a => application2 = a)
      .then(() => application2.addGroup(group2)));

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
      beforeEach(() => {
        return models.PaymentMethod.create({
          number: 'blah',
          token: STRIPE_TOKEN,
          service: 'stripe'
          })
        .then(pm => models.Donation.create({
          amount: CHARGE * 100,
          currency: CURRENCY,
          SubscriptionId: null,
          PaymentMethodId: pm.id,
          UserId: user.id,
          GroupId: group.id
        }));
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
            expect(res.rows[0]).to.have.property('amount', CHARGE);
            expect(res.rows[0]).to.have.property('amountInTxnCurrency', 1400); // taken from stripe mocks
            expect(res.rows[0]).to.have.property('txnCurrency', 'USD');
            expect(res.rows[0]).to.have.property('hostFeeInTxnCurrency', 0);
            expect(res.rows[0]).to.have.property('platformFeeInTxnCurrency', 70);
            expect(res.rows[0]).to.have.property('paymentProcessorFeeInTxnCurrency', 155);
            expect(res.rows[0]).to.have.property('txnCurrencyFxRate', 0.785);
            expect(res.rows[0]).to.have.property('netAmountInGroupCurrency', 922)
            done();
          })
          .catch(done);
      });

      it('successfully adds the user as a backer', (done) => {
        group
          .getUsers()
          .then((users) => {
            expect(users).to.have.length(2);
            const backer = _.find(users, {email: user.email});
            expect(backer.UserGroup.role).to.equal(roles.BACKER);
            done();
          })
          .catch(done);
      });

      it('successfully sends out an email to donor', () => {
        expect(emailSendSpy.lastCall.args[0]).to.equal('thankyou');
        expect(emailSendSpy.lastCall.args[1]).to.equal(user.email);
      })

    });

    describe('Recurring donation', () => {

      const customerId = stripeMock.customers.create.id;
      const planId = generatePlanId({
        currency: CURRENCY,
        interval: 'month',
        amount: 1000
      });

      const plan = _.extend({}, stripeMock.plans.create, {
        amount: 1000,
        interval: 'month',
        name: planId,
        id: planId
      });

      beforeEach(() => {
        nocks['plans.create'] = nock(STRIPE_URL)
          .post('/v1/plans')
          .reply(200, plan);

        const params = [
          `plan=${planId}`,
          'application_fee_percent=5',
          `${encodeURIComponent('metadata[groupId]')}=${group.id}`,
          `${encodeURIComponent('metadata[groupName]')}=${encodeURIComponent(group.name)}`,
          `${encodeURIComponent('metadata[paymentMethodId]')}=1`,
          `${encodeURIComponent('metadata[description]')}=${encodeURIComponent(`OpenCollective: ${group.slug}`)}`
        ].join('&');

      nocks['subscriptions.create'] = nock(STRIPE_URL)
        .post(`/v1/customers/${customerId}/subscriptions`, params)
        .reply(200, stripeMock.subscriptions.create);
      });

      describe('plan does not exist', () => {
        beforeEach(() => {
          nocks['plans.retrieve'] = nock(STRIPE_URL)
            .get(`/v1/plans/${planId}`)
            .reply(200, {
              error: stripeMock.plans.create_not_found
            });
        });

        beforeEach(() => {
          let pm;
          return models.PaymentMethod.create({
            number: 'blah',
            token: STRIPE_TOKEN,
            service: 'stripe'
            })
          .tap(paymentMethod => pm = paymentMethod)
          .then(() => models.Subscription.create({
            interval: 'month',
            currency: CURRENCY,
            amount: 10
          }))
          .then(subscription => models.Donation.create({
            amount: 1000,
            currency: CURRENCY,
            SubscriptionId: subscription.id,
            PaymentMethodId: pm.id,
            UserId: user.id,
            GroupId: group.id
          }));
        });

        it('creates a plan if it doesn\'t exist', () => {
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
              expect(users).to.have.length(2);
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

        beforeEach(() => {
          let pm;
          return models.PaymentMethod.create({
            number: 'blah',
            token: STRIPE_TOKEN,
            service: 'stripe'
            })
          .tap(paymentMethod => pm = paymentMethod)
          .then(() => models.Subscription.create({
            interval: 'month',
            currency: CURRENCY,
            amount: 10
          }))
          .then(subscription => models.Donation.create({
            amount: 1000,
            currency: CURRENCY,
            SubscriptionId: subscription.id,
            PaymentMethodId: pm.id,
            UserId: user.id,
            GroupId: group.id
          }));
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
              expect(users).to.have.length(2);
              const backer = _.find(users, {email: user.email});
              expect(backer.UserGroup.role).to.equal(roles.BACKER);
              done();
            })
            .catch(done);
        });

        it('successfully sends out an email to donor', () => {
          expect(emailSendSpy.lastCall.args[0]).to.equal('thankyou');
          expect(emailSendSpy.lastCall.args[1]).to.equal(user.email);
        })
      })

    });

    describe('Payment errors', () => {

      beforeEach(() => {
        nock.cleanAll();
        nocks['customers.create'] = nock(STRIPE_URL)
          .post('/v1/customers')
          .reply(200, stripeMock.customers.create);
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
          .replyWithError(stripeMock.charges.createError);
      });

      beforeEach(() => {
        return models.PaymentMethod.create({
          number: 'blah',
          token: STRIPE_TOKEN,
          service: 'stripe',
          })
        .then(pm => models.Donation.create({
          amount: CHARGE * 100,
          currency: CURRENCY,
          SubscriptionId: null,
          PaymentMethodId: pm.id,
          UserId: user.id,
          GroupId: group.id
        }));
      });

      it('fails paying because of a paymentMethod declined', (done) => {
        expect(emailSendMessageSpy.lastCall.args[0]).to.equal('server-errors@opencollective.com');
        expect(emailSendMessageSpy.lastCall.args[1]).to.contain('Failed to process donation');
        done();
      });

    })

  });
});
