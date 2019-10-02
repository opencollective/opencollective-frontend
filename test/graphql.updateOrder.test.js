import sinon from 'sinon';
import { expect } from 'chai';
import { pick } from 'lodash';

import * as utils from '../test/utils';
import models from '../server/models';

const ordersData = utils.data('orders');

const order = {
  id: null,
  quantity: 1,
  interval: null,
  collective: {
    id: null,
  },
};

const updateOrderQuery = `
  mutation updateOrder($order: OrderInputType!) {
    updateOrder(order: $order) {
      id
      status
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
        hostFeePercent
      }
      subscription {
        id
        amount
        interval
        isActive
        stripeSubscriptionId
      }
    }
  }
`;

describe('updateOrder', () => {
  let sandbox, user, user2, externalUser, collective, paymentMethod, existingOrder;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => sandbox.restore());

  beforeEach(async () => {
    await utils.resetTestDB();
    user = await models.User.createUserWithCollective(utils.data('user1'));
    user2 = await models.User.createUserWithCollective(utils.data('user2'));
    externalUser = await models.User.createUserWithCollective(utils.data('user3'));
    collective = await models.Collective.create(utils.data('collective1'));
    paymentMethod = await models.PaymentMethod.create({
      ...utils.data('paymentMethod2'),
      CreatedByUserId: user2.id,
    });

    await user.collective.update({ currency: 'EUR' });
    await user2.collective.update({ currency: 'EUR' });
    await collective.addHost(user.collective, user);

    await models.ConnectedAccount.create({
      service: 'stripe',
      token: 'sktest_123',
      CollectiveId: user.CollectiveId,
    });

    existingOrder = await models.Order.create({
      ...ordersData[0],
      currency: 'EUR',
      CreatedByUserId: user2.id,
      FromCollectiveId: user2.CollectiveId,
      CollectiveId: collective.id,
      totalAmount: ordersData[0].amount,
    });

    utils.stubStripeCreate(sandbox, {
      // charge: { currency: 'eur', status: 'succeeded' },
      paymentIntent: {
        charges: { data: [{ currency: 'eur', status: 'succeeded' }] },
        status: 'succeeded',
      },
    });
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  it('fails if if no authorization provided', async () => {
    order.id = existingOrder.id;
    order.totalAmount = existingOrder.totalAmount;
    const res = await utils.graphqlQuery(updateOrderQuery, { order });
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal("You don't have the permissions to edit this order");
  });

  it('fails if user is not allowed', async () => {
    order.id = existingOrder.id;
    order.totalAmount = existingOrder.totalAmount;
    const res = await utils.graphqlQuery(updateOrderQuery, { order }, externalUser);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal("You don't have the permissions to edit this order");
  });

  it('fails if no order exists yet', async () => {
    const res = await utils.graphqlQuery(updateOrderQuery, { order: { ...order, id: 957856314 } }, user2);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal("This order doesn't exist");
  });

  it('fails if no paymentMethod is included', async () => {
    order.id = existingOrder.id;
    order.totalAmount = existingOrder.totalAmount;
    const res = await utils.graphqlQuery(updateOrderQuery, { order }, user2);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal('This order requires a payment method');
  });

  it('pay a PENDING order with a credit card', async () => {
    expect(existingOrder.status).to.equal('PENDING');
    order.id = existingOrder.id;
    order.totalAmount = existingOrder.totalAmount;
    order.paymentMethod = pick(paymentMethod, ['id', 'uuid', 'service', 'token', 'name']);

    utils.stubStripeBalance(sandbox, order.totalAmount, 'eur', Math.round(order.totalAmount * 0.05), 4500); // This is the payment processor fee.

    // When the query is executed
    const res = await utils.graphqlQuery(updateOrderQuery, { order }, user2);

    // Then there should be no errors
    res.errors && console.log(res.errors);
    expect(res.errors).to.not.exist;
    expect(res.data.updateOrder.status).to.equal('PAID');
    expect(res.data.updateOrder.subscription).to.not.exist;

    const orderForCollective = res.data.updateOrder.collective;
    const transaction = await models.Transaction.findOne({
      where: {
        CollectiveId: orderForCollective.id,
        amount: existingOrder.totalAmount,
      },
    });
    expect(transaction.FromCollectiveId).to.equal(user2.CollectiveId);
    expect(transaction.CollectiveId).to.equal(orderForCollective.id);
    expect(transaction.currency).to.equal(orderForCollective.currency);
    expect(transaction.hostFeeInHostCurrency).to.equal(
      -((orderForCollective.hostFeePercent / 100) * order.totalAmount),
    );
    expect(transaction.platformFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
    expect(transaction.data.charge.currency).to.equal(orderForCollective.currency.toLowerCase());
    expect(transaction.data.charge.status).to.equal('succeeded');
    expect(transaction.data.balanceTransaction.net + transaction.hostFeeInHostCurrency).to.equal(
      transaction.netAmountInCollectiveCurrency,
    );
    expect(transaction.data.charge.currency).to.equal('eur');
  });

  it('updates an order with a new Subscription', async () => {
    order.id = existingOrder.id;
    order.interval = 'month';
    order.totalAmount = 42428963;
    order.paymentMethod = pick(paymentMethod, ['id', 'uuid', 'service', 'token', 'name']);

    utils.stubStripeBalance(sandbox, order.totalAmount, 'eur', Math.round(order.totalAmount * 0.05), 4500); // This is the payment processor fee.

    // When the query is executed
    const res = await utils.graphqlQuery(updateOrderQuery, { order }, user2);

    // Then there should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    expect(res.data.updateOrder.subscription).to.exist;
    expect(res.data.updateOrder.status).to.equal('ACTIVE');

    const { subscription } = res.data.updateOrder;

    expect(subscription.interval).to.equal('month');
    expect(subscription.isActive).to.be.true;
    expect(subscription.amount).to.equal(order.totalAmount);
  });

  it('updates an order with an existing subscription', async () => {
    const existingSubscription = await models.Subscription.create({
      amount: existingOrder.totalAmount,
      currency: existingOrder.currency,
      interval: 'month',
    });
    await existingOrder.update({ SubscriptionId: existingSubscription.id });

    order.id = existingOrder.id;
    order.interval = 'month';
    order.totalAmount = existingOrder.totalAmount;
    order.paymentMethod = pick(paymentMethod, ['id', 'uuid', 'service', 'token', 'name']);

    utils.stubStripeBalance(sandbox, order.totalAmount, 'eur', Math.round(order.totalAmount * 0.05), 4500); // This is the payment processor fee.

    // When the query is executed
    const res = await utils.graphqlQuery(updateOrderQuery, { order }, user2);

    // Then there should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;
    expect(res.data.updateOrder.subscription).to.exist;
    expect(res.data.updateOrder.status).to.equal('ACTIVE');

    const { subscription } = res.data.updateOrder;

    expect(subscription.id).to.equal(subscription.id);
    expect(subscription.interval).to.equal('month');
    expect(subscription.isActive).to.be.true;
    expect(subscription.amount).to.equal(order.totalAmount);
  });
});
