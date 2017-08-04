import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import { graphql } from 'graphql';
import sinon from 'sinon';
import * as stripe from '../server/gateways/stripe';
import Promise from 'bluebird';
import * as utils from './utils';
import models from '../server/models';

const stringify = (json) => {
  return JSON.stringify(json, null, '>>>>').replace(/\n>>>>+"([^"]+)"/g,'$1').replace(/\n|>>>>+/g,'')
}

describe('graphql.tiers.test', () => {
  let user1, user2, host, collective1, collective2, tier1, paymentMethod1;
  let sandbox;

  beforeEach(() => utils.resetTestDB());

  /**
   * Setup:
   * - User1 is a member of collective2 has a payment method on file
   * - User1 will become a backer of collective1
   * - Host is the host of both collective1 and collective2
   */

  beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => user1 = u));
  beforeEach(() => models.User.createUserWithCollective(utils.data('user2')).tap(u => user2 = u));
  beforeEach(() => models.User.createUserWithCollective(utils.data('host1')).tap(u => host = u));
  beforeEach(() => models.PaymentMethod.create({
    ...utils.data('paymentMethod2'), 
    CreatedByUserId: user1.id,
    CollectiveId: user1.CollectiveId
  }).tap(c => paymentMethod1 = c));

  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(g => collective1 = g));

  beforeEach(() => models.Collective.create(utils.data('collective2')).tap(g => collective2 = g));

  beforeEach(() => collective1.createTier(utils.data('tier1')).tap(t => tier1 = t));

  beforeEach(() => collective1.addUserWithRole(host, 'HOST'));
  beforeEach(() => collective2.addUserWithRole(host, 'HOST'));
  beforeEach(() => collective2.addUserWithRole(user1, 'ADMIN'));

  beforeEach('create stripe account', (done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => host.collective.setStripeAccount(account))
    .tap(() => done())
    .catch(done);
  });

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  before(() => {
    sandbox.stub(stripe, 'createCustomer', () => {
      return Promise.resolve({ id: 'cus_B5s4wkqxtUtNyM'});
    });
    sandbox.stub(stripe, 'createCharge', (hostStripeAccount, data) => {
      return Promise.resolve({
        "amount": data.amount,
        "balance_transaction": "txn_19XJJ02eZvKYlo2ClwuJ1rbA",
      });
    });
    sandbox.stub(stripe, 'retrieveBalanceTransaction', () => {
      return Promise.resolve({
        "id": "txn_19XJJ02eZvKYlo2ClwuJ1rbA",
        "object": "balance_transaction",
        "amount": 999,
        "available_on": 1483920000,
        "created": 1483315442,
        "currency": "usd",
        "description": null,
        "fee": 59,
        "fee_details": [
          {
            "amount": 59,
            "application": null,
            "currency": "usd",
            "description": "Stripe processing fees",
            "type": "stripe_fee"
          }
        ],
        "net": 940,
        "source": "ch_19XJJ02eZvKYlo2CHfSUsSpl",
        "status": "pending",
        "type": "charge"
      });
    });
    sandbox.stub(stripe, 'getOrCreatePlan', () => {
      return Promise.resolve({ id: 'stripePlanId-111' });
    });
    sandbox.stub(stripe, 'createSubscription', () => {
      return Promise.resolve({ id: 'stripeSubscriptionId-123' });
    });

    
  });

  describe('graphql.tiers.test.js', () => {

    describe('payment methods', () => {

      const generateOrder = (user) => {
        return {
          description: "test order",
          user: {
            email: user.email,
          },
          toCollective: { slug: collective1.slug },
          tier: { id: tier1.id },
          paymentMethod: {
            service: 'stripe',
            identifier: '4242',
            expMonth: 1,
            expYear: 2021,
            funding: 'credit',
            brand: 'Visa',
            country: 'US',
            token: 'card_1AejcADjPFcHOcTmBJRASiOV'
          }
        }
      }

      it("fails to use a payment method on file if not logged in", async () => {
        const order = generateOrder(user1);
        order.paymentMethod = { uuid: paymentMethod1.uuid };
        const query = `
        mutation createOrder {
          createOrder(order: ${stringify(order)}) {
            createdByUser {
              id,
              email
            },
            paymentMethod {
              brand,
              identifier
            }
          }
        }`;

        const result = await graphql(schema, query, null, {});
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal("You need to be logged in to be able to use a payment method on file");
      });
    
      it("fails to use a payment method on file if not logged in as the owner", async () => {
        const order = generateOrder(user1);
        order.paymentMethod = { uuid: paymentMethod1.uuid };
        const query = `
        mutation createOrder {
          createOrder(order: ${stringify(order)}) {
            createdByUser {
              id,
              email
            },
            paymentMethod {
              brand,
              identifier
            }
          }
        }`;

        const result = await graphql(schema, query, null, { remoteUser: user2 });
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal("You don't have a payment method with that uuid");
      });
          
      it("user1 becomes a backer of collective1 using a payment method on file", async () => {
        const orderInput = generateOrder(user1);
        orderInput.paymentMethod = { uuid: paymentMethod1.uuid };
        const query = `
        mutation createOrder {
          createOrder(order: ${stringify(orderInput)}) {
            createdByUser {
              id,
              email
            },
            paymentMethod {
              brand,
              identifier
            }
          }
        }`;

        const result = await graphql(schema, query, null, { remoteUser: user1 });
        expect(result.errors).to.not.exist;

        const members = await models.Member.findAll({where: { MemberCollectiveId: user1.CollectiveId, CollectiveId: collective1.id }});
        const orders = await models.Order.findAll({where: { FromCollectiveId: user1.CollectiveId, ToCollectiveId: collective1.id }});
        const subscription = await models.Subscription.findById(orders[0].SubscriptionId);
        const order = await models.Order.findById(orders[0].id);
        const transactions = await models.Transaction.findAll({where: { FromCollectiveId: user1.CollectiveId, ToCollectiveId: collective1.id }});

        expect(members).to.have.length(1);
        expect(orders).to.have.length(1);
        expect(orders[0].SubscriptionId).to.not.be.null;
        expect(subscription.interval).to.equal(tier1.interval);
        expect(transactions).to.have.length(1);
        expect(transactions[0].amount).to.equal(tier1.amount);
        expect(order.processedAt).to.not.be.null;
      });
      
      it("user1 becomes a backer of collective1 using a new payment method", async () => {
        const query = `
        mutation createOrder {
          createOrder(order: ${stringify(generateOrder(user1))}) {
            createdByUser {
              id,
              email
            },
            paymentMethod {
              brand,
              identifier
            }
          }
        }`;

        const result = await graphql(schema, query, null, {});
        expect(result.errors).to.not.exist;
        const members = await models.Member.findAll({where: { MemberCollectiveId: user1.CollectiveId, CollectiveId: collective1.id }});
        expect(members).to.have.length(1);
        const paymentMethods = await models.PaymentMethod.findAll({where: { CreatedByUserId: user1.id }});
        expect(paymentMethods).to.have.length(2);
      });
    });
  });
});
