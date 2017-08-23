import { expect } from 'chai';
import { describe, it } from 'mocha';
import schema from '../server/graphql/schema';
import models from '../server/models';
import { graphql } from 'graphql';
import * as utils from './utils';
import Stripe from 'stripe';
import config from 'config';
import nock from 'nock';

import './graphql.createOrder.nock';

export const appStripe = Stripe(config.stripe.secret);

if (process.env.RECORD) {
  nock.recorder.rec();
}

const order = {
    "quantity": 1,
    "interval": null,
    "totalAmount": 154300,
    "paymentMethod": {
        "identifier": "4242",
        "expMonth": 10,
        "expYear": 2023,
        "brand": "Visa",
        "country": "US",
        "funding": "credit"
    },
    "tier": {
        "id": 71,
        "amount": null
    },
    "toCollective": {
        "slug": "brusselstogether"
    }
}

const constants = {
  paymentMethod: {
    expMonth: 11,
    expYear: 2025
  }
};

describe('Query Tests', () => {

  beforeEach(() => utils.loadDB('opencollective_dvl'));

  it('creates an order as new user', async () => {

    const stripeCardToken = await appStripe.tokens.create({
      card: {
        number: '4242424242424242',
        exp_month: constants.paymentMethod.expMonth,
        exp_year: constants.paymentMethod.expYear,
        cvc: 222
      }
    });

    order.user = {
      firstName: "John",
      lastName: "Smith",
      email: "jsmith@email.com"
    };
    order.paymentMethod.token = stripeCardToken.id;
    
    const query = `
    mutation createOrder {
      createOrder(order: ${utils.stringify(order)}) {
        id
        totalAmount
        fromCollective {
          id
        }
        toCollective {
          id
          slug
          currency
        }
        processedAt
      }
    }
    `;

    const res = await graphql(schema, query, null, {});
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

    const stripeCardToken = await appStripe.tokens.create({
      card: {
        number: '4242424242424242',
        exp_month: constants.paymentMethod.expMonth,
        exp_year: constants.paymentMethod.expYear,
        cvc: 222
      }
    });

    order.fromCollective = { id: xdamman.CollectiveId };
    order.paymentMethod.token = stripeCardToken.id;
    
    const query = `
    mutation createOrder {
      createOrder(order: ${utils.stringify(order)}) {
        id
        totalAmount
        toCollective {
          id
          slug
          currency
        }
        processedAt
      }
    }
    `;

    const res = await graphql(schema, query, null, { remoteUser: xdamman });
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

  it('creates an order as logged in user using save credit card', async () => {

    const xdamman = await models.User.findById(2);
    const collectiveToEdit = {
      id: xdamman.CollectiveId,
      paymentMethods: []
    }

    const stripeCardToken = await appStripe.tokens.create({
      card: {
        number: '4242424242424242',
        exp_month: constants.paymentMethod.expMonth,
        exp_year: constants.paymentMethod.expYear,
        cvc: 222
      }
    });

    collectiveToEdit.paymentMethods.push({
      identifier: '4242',
      service: 'stripe',
      token: stripeCardToken.id
    })

    let query, res;
    query = `
    mutation editCollective {
      editCollective(collective: ${utils.stringify(collectiveToEdit)}) {
        id,
        paymentMethods {
          uuid
          service
          identifier
        }
      }
    }
    `;
    res = await graphql(schema, query, null, { remoteUser: xdamman });
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    order.fromCollective = { id: xdamman.CollectiveId }
    order.paymentMethod = { uuid: res.data.editCollective.paymentMethods[0].uuid };
    
    query = `
    mutation createOrder {
      createOrder(order: ${utils.stringify(order)}) {
        id
        totalAmount
        toCollective {
          id
          slug
          currency
        }
        processedAt
      }
    }
    `;

    res = await graphql(schema, query, null, { remoteUser: xdamman });
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

    const xdamman = await models.User.findById(2);

    const stripeCardToken = await appStripe.tokens.create({
      card: {
        number: '4242424242424242',
        exp_month: constants.paymentMethod.expMonth,
        exp_year: constants.paymentMethod.expYear,
        cvc: 222
      }
    });

    order.fromCollective = { id: xdamman.CollectiveId };
    order.paymentMethod = {
      ...constants.paymentMethod,
      token: stripeCardToken.id
    };
    order.interval = 'month';
    order.totalAmount = 1000;

    const query = `
    mutation createOrder {
      createOrder(order: ${utils.stringify(order)}) {
        id
        totalAmount
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

    const res = await graphql(schema, query, null, { remoteUser: xdamman });
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
  })

});