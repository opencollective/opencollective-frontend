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
  let user1, user2, host, group1, group2, tier1, paymentMethod1;
  let sandbox;

  beforeEach(() => utils.resetTestDB());

  /**
   * Setup:
   * - User1 is a member of group2 has a payment method on file
   * - User1 will become a backer of group1
   * - Host is the host of both group1 and group2
   */

  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user1 = u));
  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));
  beforeEach(() => models.User.create(utils.data('host1')).tap(u => host = u));
  beforeEach(() => models.PaymentMethod.create({...utils.data('paymentMethod2'), UserId: user1.id}).tap(c => paymentMethod1 = c));

  beforeEach(() => models.Group.create(utils.data('group1')).tap(g => group1 = g));

  beforeEach(() => models.Group.create(utils.data('group2')).tap(g => group2 = g));

  beforeEach(() => group1.createTier(utils.data('tier1')).tap(t => tier1 = t));

  beforeEach(() => group1.addUserWithRole(host, 'HOST'));
  beforeEach(() => group2.addUserWithRole(host, 'HOST'));
  beforeEach(() => group2.addUserWithRole(user1, 'MEMBER'));

  beforeEach('create stripe account', (done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => host.setStripeAccount(account))
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

      const generateResponse = (user) => {
        return {
          description: "test response",
          user: {
            email: user.email,
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
          },
          collective: { slug: group1.slug },
          tier: { id: tier1.id }
        }
      }

      it("fails to use a payment method on file if not logged in", async () => {
        const response = generateResponse(user1);
        response.user.paymentMethod = { uuid: paymentMethod1.uuid };
        const query = `
        mutation createResponse {
          createResponse(response: ${stringify(response)}) {
            user {
              id,
              email,
              paymentMethods {
                brand,
                identifier
              }
            }
          }
        }`;

        const result = await graphql(schema, query, null, {});
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal("You need to be logged in to be able to use a payment method on file");
      });
    
      it("fails to use a payment method on file if not logged in as the owner", async () => {
        const response = generateResponse(user1);
        response.user.paymentMethod = { uuid: paymentMethod1.uuid };
        const query = `
        mutation createResponse {
          createResponse(response: ${stringify(response)}) {
            user {
              id,
              email,
              paymentMethods {
                brand,
                identifier
              }
            }
          }
        }`;

        const result = await graphql(schema, query, null, { remoteUser: user2 });
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal("You don't have a payment method with that uuid");
      });
          
      it("user1 becomes a backer of group1 using a payment method on file", async () => {
        const responseInput = generateResponse(user1);
        responseInput.user.paymentMethod = { uuid: paymentMethod1.uuid };
        const query = `
        mutation createResponse {
          createResponse(response: ${stringify(responseInput)}) {
            user {
              id,
              email,
              paymentMethods {
                brand,
                identifier
              }
            }
          }
        }`;

        const result = await graphql(schema, query, null, { remoteUser: user1 });
        console.log("result", result);
        console.log("result", result.data.createResponse);
        expect(result.errors).to.not.exist;

        const memberships = await models.UserGroup.findAll({where: { UserId: user1.id, GroupId: group1.id }});
        const donations = await models.Donation.findAll({where: { UserId: user1.id, GroupId: group1.id }});
        const subscription = await models.Subscription.findById(donations[0].SubscriptionId);
        const response = await models.Response.findById(donations[0].ResponseId);
        const transactions = await models.Transaction.findAll({where: { UserId: user1.id, GroupId: group1.id }});

        expect(memberships).to.have.length(1);
        expect(donations).to.have.length(1);
        expect(donations[0].SubscriptionId).to.not.be.null;
        expect(subscription.interval).to.equal(tier1.interval);
        expect(transactions).to.have.length(1);
        expect(transactions[0].amount).to.equal(tier1.amount);
        expect(response.status).to.equal('PROCESSED');
      });
      
      it("user1 becomes a backer of group1 using a new payment method", async () => {
        const query = `
        mutation createResponse {
          createResponse(response: ${stringify(generateResponse(user1))}) {
            user {
              id,
              email,
              paymentMethods {
                brand,
                identifier
              }
            }
          }
        }`;

        const result = await graphql(schema, query, null, {});
        console.log("result", result);
        console.log("result", result.data.createResponse);
        expect(result.errors).to.not.exist;
        const memberships = await models.UserGroup.findAll({where: { UserId: user1.id, GroupId: group1.id }});
        expect(memberships).to.have.length(1);
        const paymentMethods = await models.PaymentMethod.findAll({where: { UserId: user1.id }});
        expect(paymentMethods).to.have.length(2);
      });
    });
  });
});
