import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';
import * as utils from './utils';
import nock from 'nock';
import initNock from './graphql.matchingFund.nock';

const createOrderQuery = `
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      createdByUser {
        id
      }
      paymentMethod {
        id
      }
      totalAmount
      fromCollective {
        id
        slug
        name
        website
      }
      collective {
        id
        slug
        currency
      }
      referral {
        id
        slug
      }
      transactions {
        id
        type
        amount
        description
        fromCollective {
          id
          slug
        }
      }
      subscription {
        id
        amount
        interval
        isActive
        stripeSubscriptionId
      }
      processedAt
    }
  }
`;

describe('graphql.matchingFund.test.js', () => {
  
  let collective, host, admin, user1, user2;
  before(initNock);

  after(() => {
    nock.cleanAll();
  });

  beforeEach(() => utils.resetTestDB());
  beforeEach(async () => {
    admin = await models.User.createUserWithCollective({ name: "admin" });
    user1 = await models.User.createUserWithCollective({ name: "user1", email: "user1@opencollective.com" });
    user2 = await models.User.createUserWithCollective({ name: "user2", email: "user2@opencollective.com" });
    host = await models.Collective.create({ type: "ORGANIZATION", name: "host", isActive: true});
    collective = await models.Collective.create({ name: "tipbox", slug: "tipbox", currency: "USD", hostFeePercent: 5, isActive: true, HostCollectiveId: host.id });
    await models.ConnectedAccount.create({
      CreatedByUserId: admin.id,    
      service: 'stripe',
      username: 'acct_18KWlTLzdXg9xKNS', // using opensource host test stripe account
      token: 'sk_test_iDWQubtz4ixk0FQg1csgCi6p',
      data: {
        publishableKey: 'pk_test_l7H1cDlh2AekeETfq742VJbC'
      },
      CollectiveId: host.id
    });
    await models.Member.create({
      CreatedByUserId: admin.id,
      CollectiveId: collective.id,
      MemberCollectiveId: host.id,
      role: 'HOST'
    });

    // €1,000 matching fund @ 2x
    user1.paymentMethod = await models.PaymentMethod.create({
      service: "stripe",
      matching: 2,
      initialBalance: 150000, // $1,500
      currency: 'EUR',
      data: {
        expMonth: 11,
        expYear: 2025
      },
      token: await utils.createStripeToken(),
      CollectiveId: user1.CollectiveId
    });

    user2.paymentMethod = await models.PaymentMethod.create({
      service: "stripe",
      currency: 'USD',
      data: {
        expMonth: 12,
        expYear: 2025
      },
      token: await utils.createStripeToken(),
      CollectiveId: user2.CollectiveId
    });
  });

  it('happy path one time donation', async () => {

    const order = {
      "fromCollective": {
        "id": user2.CollectiveId
      },
      "quantity": 1,
      "interval": null,
      "totalAmount": 5000, // $50
      "collective": {
        "id": collective.id
      },
      "paymentMethod": { uuid: user2.paymentMethod.uuid },
      "matchingFund": user1.paymentMethod.uuid.substr(0, 8),
      "referral": { id: user1.CollectiveId }
    };

    const res = await utils.graphqlQuery(createOrderQuery, { order }, user2);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    const orderCreated = res.data.createOrder;

    const fromCollective = res.data.createOrder.fromCollective;
    const transactions = await models.Transaction.findAll({
      where: { OrderId: orderCreated.id }
    });
    expect(transactions.length).to.equal(4);
    expect(fromCollective.id).to.equal(user2.CollectiveId);
    expect(orderCreated.referral.id).to.equal(user1.CollectiveId);
    expect(transactions[0].CollectiveId).to.equal(user2.CollectiveId);
    expect(transactions[0].description).to.equal(`Donation to tipbox`);
    expect(transactions[2].CollectiveId).to.equal(user1.CollectiveId);
    expect(transactions[2].description).to.equal(`Matching 2x user2's donation`);
    expect(transactions[3].amount).to.equal(user1.paymentMethod.matching * order.totalAmount);

    const balance = await user1.paymentMethod.getBalanceForUser(user2);
    expect(balance.amount).to.equal(141621); // €1,500 - $100

  });

  it('happy path recurring donation', async () => {
    const order = {
      "fromCollective": {
        "id": user2.CollectiveId
      },
      "quantity": 1,
      "interval": "month",
      "totalAmount": 5000, // $50
      "collective": {
        "id": collective.id
      },
      "paymentMethod": { uuid: user2.paymentMethod.uuid },
      "matchingFund": user1.paymentMethod.uuid.substr(0, 8),
      "referral": { id: user1.CollectiveId }
    };

    const res = await utils.graphqlQuery(createOrderQuery, { order }, user2);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    const orderCreated = res.data.createOrder;

    const fromCollective = res.data.createOrder.fromCollective;
    const transactions = await models.Transaction.findAll({
      where: { OrderId: orderCreated.id }
    });
    expect(transactions.length).to.equal(4);
    expect(fromCollective.id).to.equal(user2.CollectiveId);
    expect(orderCreated.referral.id).to.equal(user1.CollectiveId);
    expect(transactions[0].CollectiveId).to.equal(user2.CollectiveId);
    expect(transactions[0].description).to.equal(`Monthly donation to tipbox`);
    expect(transactions[2].CollectiveId).to.equal(user1.CollectiveId);
    expect(transactions[2].description).to.equal(`Matching 2x user2's donation`);
    expect(transactions[3].amount).to.equal(user1.paymentMethod.matching * order.totalAmount);

    const balance = await user1.paymentMethod.getBalanceForUser(user2);
    expect(balance.amount).to.equal(141621); // €1,500 - $100


    const subscriptions = await models.Subscription.findAll();
    expect(subscriptions.length).to.equal(1);
    expect(subscriptions[0].interval).to.equal('month');
    expect(subscriptions[0].amount).to.equal(order.totalAmount);
    expect(subscriptions[0].stripeSubscriptionId).to.match(/^sub_.{14}$/);
    const dbOrder = await models.Order.findById(orderCreated.id);
    expect(dbOrder.SubscriptionId).to.equal(subscriptions[0].id);

  });

  it('fails if not enough funds available in matching fund', async () => {
    const order = {
      "fromCollective": {
        "id": user2.CollectiveId
      },
      "quantity": 1,
      "interval": null,
      "totalAmount": 100000, // $1,000, should fail because there is less than 2x$1,000 in the 2x matching fund
      "collective": {
        "id": collective.id
      },
      "paymentMethod": { uuid: user2.paymentMethod.uuid },
      "matchingFund": user1.paymentMethod.uuid.substr(0, 8),
      "referral": { id: user1.CollectiveId }
    };

    const res = await utils.graphqlQuery(createOrderQuery, { order }, user2);
    res.errors && console.error(res.errors);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal(`There is not enough funds left on this matching fund to match your order (balance: €1,500`);
  })

});