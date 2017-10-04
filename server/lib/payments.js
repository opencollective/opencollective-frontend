import Promise from 'bluebird';
import { includes, pick } from 'lodash';

import models from '../models';
import emailLib from './email';
import { types } from '../constants/collectives';
import * as paymentProviders from '../paymentProviders';

/**
 * Execute an order as user using paymentMethod
 * It validates the paymentMethod and makes sure the user can use it
 * @param {*} order { tier, description, totalAmount, currency, interval (null|month|year), paymentMethod }
 */
export const executeOrder = (user, order) => {

  if (! (order instanceof models.Order)) {
    return Promise.reject(new Error("order should be an instance of the Order model"));
  }
  if (!order) {
    return Promise.reject(new Error("No order provided"));
  }
  if (order.processedAt) {
    return Promise.reject(new Error(`This order (#${order.id}) has already been processed at ${order.processedAt}`));
  }

  const payment = {
    amount: order.totalAmount,
    interval: order.interval,
    currency: order.currency
  };

  try {
    validatePayment(payment);
  } catch (error) {
    return Promise.reject(error);
  }

  return order.populate()
    .then(() => {
      if (payment.interval) {
        return models.Subscription.create(payment)
          .then(subscription => {
            order.subscription = subscription;
            return order.update({ SubscriptionId: subscription.id });
          })
      }
    })
    .then(() => {
      const paymentProvider = (order.paymentMethod) ? order.paymentMethod.service : 'manual';
      return paymentProviders[paymentProvider].processOrder(order); // eslint-disable-line import/namespace
    })
    .then(transaction => {
      order.transaction = transaction;
      sendConfirmationEmail(order); // async
      return null;
    });
}

const validatePayment = (payment) => {
  if (payment.interval && !includes(['month', 'year'], payment.interval)) {
    throw new Error('Interval should be null, month or year.');
  }

  if (!payment.amount) {
    throw new Error('payment.amount missing');
  }

  if (payment.amount < 50) {
    throw new Error('payment.amount must be at least $0.50');
  }
}

const sendConfirmationEmail = (order) => {

  const { collective, tier, interval } = order;
  const user = order.createdByUser;

  if (collective.type === types.EVENT) {
    return emailLib.send(
      'ticket.confirmed',
      user.email,
      { order: order.info,
        user: user.info,
        collective: collective.info,
        tier: tier.info
      }, {
        from: `${collective.name} <hello@${collective.slug}.opencollective.com>`
      })
  } else {
    // normal order
    return collective.getRelatedCollectives(2, 0)
    .then((relatedCollectives) => emailLib.send(
      'thankyou',
      user.email,
      { order: order.info,
        transaction: pick(order.transaction, ['createdAt', 'uuid']),
        user: user.info,
        collective: collective.info,
        relatedCollectives,
        interval,
        monthlyInterval: (interval === 'month'),
        firstPayment: true,
        subscriptionsLink: user.generateLoginLink('/subscriptions')
      },
      {
        from: `${collective.name} <hello@${collective.slug}.opencollective.com>`
      }
    ));
  }
}