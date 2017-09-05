import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';
import * as utils from './utils';
import Stripe from 'stripe';

import './graphql.createOrder.nock';

const order = {
    "quantity": 1,
    "interval": null,
    "totalAmount": 154300,
    "paymentMethod": {
        "name": "4242",
        "data": {
          "expMonth": 10,
          "expYear": 2023,
          "brand": "Visa",
          "country": "US",
          "funding": "credit"
        }
    },
    "tier": {
        "id": 71,
        "amount": null
    },
    "toCollective": {
        "slug": "brusselstogether"
    }
  }

const createOrderQuery = `
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      createdByUser {
        id
      }
      totalAmount
      fromCollective {
        id
        name
      }
      toCollective {
        id
        slug
        currency
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

  const constants = {
  paymentMethod: {
    service: "stripe",
    data: {
      expMonth: 11,
      expYear: 2025
    }
  }
};

describe('createOrder', () => {

  beforeEach(() => utils.loadDB('opencollective_dvl'));

  it('creates an order as new user', async () => {

    const stripeCardToken = await utils.createStripeToken();

    order.user = {
      firstName: "John",
      lastName: "Smith",
      email: "jsmith@email.com"
    };
    order.paymentMethod.token = stripeCardToken;

    const res = await utils.graphqlQuery(createOrderQuery, { order });
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    const fromCollective = res.data.createOrder.fromCollective;
    const toCollective = res.data.createOrder.toCollective;
    const transaction = await models.Transaction.findOne({
      where: { ToCollectiveId: toCollective.id, amount: order.totalAmount }
    });
    expect(transaction.FromCollectiveId).to.equal(fromCollective.id);
    expect(transaction.ToCollectiveId).to.equal(toCollective.id);
    expect(transaction.currency).to.equal(toCollective.currency);
    expect(transaction.hostFeeInTxnCurrency).to.equal(0.05 * order.totalAmount);
    expect(transaction.platformFeeInTxnCurrency).to.equal(0.05 * order.totalAmount);
    expect(transaction.data.charge.currency).to.equal(toCollective.currency.toLowerCase());
    expect(transaction.data.charge.status).to.equal('succeeded');
    expect(transaction.data.balanceTransaction.net - transaction.hostFeeInTxnCurrency).to.equal(transaction.netAmountInCollectiveCurrency);

    // no customer should be created on the connected account for one time charges
    expect(transaction.data.charge.customer).to.equal(null);

    // make sure the payment has been recorded in the connected Stripe Account of the host
    const hostMember = await models.Member.findOne({ where: { CollectiveId: toCollective.id, role: 'HOST' } });
    const hostStripeAccount = await models.ConnectedAccount.findOne({
      where: { service: 'stripe', CollectiveId: hostMember.CollectiveId }
    });
    const charge = await Stripe(hostStripeAccount.token).charges.retrieve(transaction.data.charge.id);
    expect(charge.source.last4).to.equal('4242');
  });

  it('creates an order as logged in user', async () => {

    const xdamman = await models.User.findById(2);

    const stripeCardToken = await utils.createStripeToken();

    order.fromCollective = { id: xdamman.CollectiveId };
    order.paymentMethod.token = stripeCardToken;

    const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    const toCollective = res.data.createOrder.toCollective;
    const transaction = await models.Transaction.findOne({
      where: { ToCollectiveId: toCollective.id, amount: order.totalAmount }
    });
    expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
    expect(transaction.ToCollectiveId).to.equal(toCollective.id);
    expect(transaction.currency).to.equal(toCollective.currency);
    expect(transaction.hostFeeInTxnCurrency).to.equal(0.05 * order.totalAmount);
    expect(transaction.platformFeeInTxnCurrency).to.equal(0.05 * order.totalAmount);
    expect(transaction.data.charge.currency).to.equal(toCollective.currency.toLowerCase());
    expect(transaction.data.charge.status).to.equal('succeeded');
    expect(transaction.data.balanceTransaction.net - transaction.hostFeeInTxnCurrency).to.equal(transaction.netAmountInCollectiveCurrency);

    // no customer should be created on the connected account for one time charges
    expect(transaction.data.charge.customer).to.equal(null);

    // make sure the payment has been recorded in the connected Stripe Account of the host
    const hostMember = await models.Member.findOne({ where: { CollectiveId: toCollective.id, role: 'HOST' } });
    const hostStripeAccount = await models.ConnectedAccount.findOne({
      where: { service: 'stripe', CollectiveId: hostMember.CollectiveId }
    });
    const charge = await Stripe(hostStripeAccount.token).charges.retrieve(transaction.data.charge.id);
    expect(charge.source.last4).to.equal('4242');
  });

  it('creates an order as logged in user using saved credit card', async () => {

    const token = await utils.createStripeToken();
    const xdamman = await models.User.findById(2);
    const collectiveToEdit = {
      id: xdamman.CollectiveId,
      paymentMethods: []
    }
    
    collectiveToEdit.paymentMethods.push({
      name: '4242',
      service: 'stripe',
      token
    });

    let query, res;
    query = `
    mutation editCollective($collective: CollectiveInputType!) {
      editCollective(collective: $collective) {
        id,
        paymentMethods {
          uuid
          service
          name
        }
      }
    }
    `;
    res = await utils.graphqlQuery(query, { collective: collectiveToEdit }, xdamman);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    order.fromCollective = { id: xdamman.CollectiveId }
    order.paymentMethod = { uuid: res.data.editCollective.paymentMethods[0].uuid };

    res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    const toCollective = res.data.createOrder.toCollective;
    const transaction = await models.Transaction.findOne({
      where: { ToCollectiveId: toCollective.id, amount: order.totalAmount }
    });
    expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
    expect(transaction.ToCollectiveId).to.equal(toCollective.id);
    expect(transaction.currency).to.equal(toCollective.currency);
    expect(transaction.hostFeeInTxnCurrency).to.equal(0.05 * order.totalAmount);
    expect(transaction.platformFeeInTxnCurrency).to.equal(0.05 * order.totalAmount);
    expect(transaction.data.charge.currency).to.equal(toCollective.currency.toLowerCase());
    expect(transaction.data.charge.status).to.equal('succeeded');
    expect(transaction.data.balanceTransaction.net - transaction.hostFeeInTxnCurrency).to.equal(transaction.netAmountInCollectiveCurrency);

    // no customer should be created on the connected account for one time charges
    expect(transaction.data.charge.customer).to.equal(null);

    // make sure the payment has been recorded in the connected Stripe Account of the host
    const hostMember = await models.Member.findOne({ where: { CollectiveId: toCollective.id, role: 'HOST' } });
    const hostStripeAccount = await models.ConnectedAccount.findOne({
      where: { service: 'stripe', CollectiveId: hostMember.CollectiveId }
    });
    const charge = await Stripe(hostStripeAccount.token).charges.retrieve(transaction.data.charge.id);
    expect(charge.source.last4).to.equal('4242');
  });

  it('creates a recurring donation as logged in user', async () => {

    const token = await utils.createStripeToken();
    const xdamman = await models.User.findById(2);

    order.fromCollective = { id: xdamman.CollectiveId };
    order.paymentMethod = {
      ...constants.paymentMethod,
      token
    };
    order.interval = 'month';
    order.totalAmount = 1000;

    const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    const orderCreated = res.data.createOrder;
    const toCollective = orderCreated.toCollective;
    const subscription = orderCreated.subscription;
    expect(orderCreated.processedAt).to.not.be.null;
    expect(subscription.interval).to.equal('month');
    expect(subscription.isActive).to.be.true;
    expect(subscription.amount).to.equal(order.totalAmount);

    const transaction = await models.Transaction.findOne({
      where: { ToCollectiveId: toCollective.id, FromCollectiveId: xdamman.CollectiveId, amount: order.totalAmount }
    });

    // make sure the transaction has been recorded
    expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
    expect(transaction.ToCollectiveId).to.equal(toCollective.id);
    expect(transaction.currency).to.equal(toCollective.currency);

    // make sure the subscription has been recorded in the connected Stripe Account of the host
    const hostMember = await models.Member.findOne({ where: { CollectiveId: toCollective.id, role: 'HOST' } });
    const hostStripeAccount = await models.ConnectedAccount.findOne({
      where: { service: 'stripe', CollectiveId: hostMember.CollectiveId }
    });
    const stripeSubscription = await Stripe(hostStripeAccount.token).subscriptions.retrieve(subscription.stripeSubscriptionId);
    expect(stripeSubscription.application_fee_percent).to.equal(5);
    expect(stripeSubscription.plan.id).to.equal('EUR-MONTH-1000');
    expect(stripeSubscription.plan.interval).to.equal('month');

    const paymentMethod = await models.PaymentMethod.findById(Number(stripeSubscription.metadata.PaymentMethodId));
    expect(paymentMethod.data.CustomerIdForHost[hostStripeAccount.username]).to.equal(stripeSubscription.customer);
  });

  it('creates an order as a new user for a new organization', async () => {

    const token = await utils.createStripeToken();

    order.user = {
      firstName: "John",
      lastName: "Smith",
      email: "jsmith@email.com"
    };

    order.fromCollective = {
      name: "NewCo",
      website: "http://newco.com"
    };

    order.paymentMethod = {
      ...constants.paymentMethod,
      token,
    }

    const res = await utils.graphqlQuery(createOrderQuery, { order });
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    const orderCreated = res.data.createOrder;
    const fromCollective = orderCreated.fromCollective;
    const toCollective = orderCreated.toCollective;
    const transactions = await models.Transaction.findAll({ where: { OrderId: orderCreated.id }});
    expect(transactions.length).to.equal(2);
    expect(transactions[0].type).to.equal('EXPENSE');
    expect(transactions[0].FromCollectiveId).to.equal(toCollective.id);
    expect(transactions[0].ToCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].type).to.equal('DONATION');
    expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].ToCollectiveId).to.equal(toCollective.id);
  });

  it('creates an order as a logged in user for an existing organization', async () => {

    const token = await utils.createStripeToken();
    const xdamman = await models.User.findById(2);
    const newco = await models.Collective.create({
      type: 'ORGANIZATION',
      name: "newco",
      CreatedByUserId: xdamman.id
    });

    order.fromCollective = { id: newco.id };

    order.paymentMethod = {
      ...constants.paymentMethod,
      token,
    }

    // Should fail if not an admin or member of the organization
    let res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal("You don't have sufficient permissions to create an order on behalf of the newco organization");

    await models.Member.create({
      CollectiveId: newco.id,
      MemberCollectiveId: xdamman.CollectiveId,
      role: 'MEMBER',
      CreatedByUserId: xdamman.id
    });

    res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    const orderCreated = res.data.createOrder;
    const fromCollective = orderCreated.fromCollective;
    const toCollective = orderCreated.toCollective;
    const transactions = await models.Transaction.findAll({ where: { OrderId: orderCreated.id }});
    expect(orderCreated.createdByUser.id).to.equal(xdamman.id);
    expect(transactions.length).to.equal(2);
    expect(transactions[0].type).to.equal('EXPENSE');
    expect(transactions[0].FromCollectiveId).to.equal(toCollective.id);
    expect(transactions[0].ToCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].type).to.equal('DONATION');
    expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].ToCollectiveId).to.equal(toCollective.id);
  });

  it(`creates an order as a logged in user for an existing collective using the collective's payment method`, async () => {

    const token = await utils.createStripeToken();
    const xdamman = await models.User.findById(2);
    const newco = await models.Collective.create({
      type: 'ORGANIZATION',
      name: "newco",
      CreatedByUserId: xdamman.id
    });

    order.fromCollective = { id: newco.id };
    order.totalAmount = 20000;
    const paymentMethod = await models.PaymentMethod.create({
      ...constants.paymentMethod,
      token,
      monthlyLimitPerMember: 10000,
      CollectiveId: newco.id
    });

    order.paymentMethod = { uuid: paymentMethod.uuid };

    // Should fail if not an admin or member of the organization
    let res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal("You don't have sufficient permissions to create an order on behalf of the newco organization");

    await models.Member.create({
      CollectiveId: newco.id,
      MemberCollectiveId: xdamman.CollectiveId,
      role: 'MEMBER',
      CreatedByUserId: xdamman.id
    });

    // Should fail if order.totalAmount > PaymentMethod.monthlyLimitPerMember
    res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal("The total amount of this order (€200 ~= $238) is higher than your monthly spending limit on this payment method ($100)");
    
    await paymentMethod.update({ monthlyLimitPerMember: 25000 }); // $250 limit
    res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    const availableBalance = await paymentMethod.getBalanceForUser(xdamman);
    expect(availableBalance.amount).to.equal(1160);
    
    const orderCreated = res.data.createOrder;
    const fromCollective = orderCreated.fromCollective;
    const toCollective = orderCreated.toCollective;
    const transactions = await models.Transaction.findAll({ where: { OrderId: orderCreated.id }});
    expect(orderCreated.createdByUser.id).to.equal(xdamman.id);
    expect(transactions.length).to.equal(2);
    expect(transactions[0].type).to.equal('EXPENSE');
    expect(transactions[0].FromCollectiveId).to.equal(toCollective.id);
    expect(transactions[0].ToCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].type).to.equal('DONATION');
    expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].ToCollectiveId).to.equal(toCollective.id);

    // Should fail if order.totalAmount > PaymentMethod.getBalanceForUser
    res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal("You don't have enough funds available ($12 left) to execute this order (€200 ~= $238)");

  });

  it(`creates an order as a logged in user for an existing collective using the collective's balance`, async () => {

    let query;

    const xdamman = await models.User.findById(2);
    const fromCollective = await models.Collective.findOne({ where: { slug: 'opensource' }})
    const toCollective = await models.Collective.findOne({ where: { slug: 'apex' }})

    await models.Member.create({
      CreatedByUserId: xdamman.id,
      CollectiveId: fromCollective.id,
      MemberCollectiveId: xdamman.CollectiveId,
      role: 'ADMIN'
    });

    const paymentMethod = await models.PaymentMethod.create({
      CreatedByUserId: xdamman.id,
      service: 'opencollective',
      CollectiveId: fromCollective.id
    });

    order.fromCollective = { id: fromCollective.id };
    order.toCollective = { id: toCollective.id };
    order.paymentMethod = { uuid: paymentMethod.uuid };
    order.interval = null;
    order.totalAmount = 10000000;
    delete order.tier;


    // Should fail if not enough funds in the fromCollective
    let res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal("You don't have enough funds available ($3,317 left) to execute this order ($100,000)");

    order.totalAmount = 20000;

    res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    const availableBalance = await paymentMethod.getBalanceForUser(xdamman);
    expect(availableBalance.amount).to.equal(311666);
    
    const orderCreated = res.data.createOrder;
    const transactions = await models.Transaction.findAll({ where: { OrderId: orderCreated.id }});
    expect(orderCreated.createdByUser.id).to.equal(xdamman.id);
    expect(transactions.length).to.equal(2);
    expect(transactions[0].type).to.equal('EXPENSE');
    expect(transactions[0].FromCollectiveId).to.equal(toCollective.id);
    expect(transactions[0].ToCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].type).to.equal('DONATION');
    expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].ToCollectiveId).to.equal(toCollective.id);

  });
  
});