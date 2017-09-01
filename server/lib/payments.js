import Promise from 'bluebird';
import { includes, pick } from 'lodash';

import models from '../models';
import emailLib from './email';
import { types } from '../constants/collectives';
import { formatCurrency } from '../lib/utils';
import * as paymentProviders from '../paymentProviders';
import { getFxRate } from '../lib/currency';

const validatePaymentMethodForOrder = (order, paymentMethod) => {
  // If the payment method doesn't belong to the user, it can only be used to execute orders on behalf of the collective it is associated with
  if (paymentMethod.CreatedByUserId !== order.CreatedByUserId && paymentMethod.CollectiveId !== order.FromCollectiveId) {
    throw new Error(`This payment method can only be used to create orders on behalf of the collective id ${paymentMethod.CollectiveId}`);
  }

  if (order.interval && !paymentMethod.features.recurring) {
    throw new Error("This payment method doesn't support recurring payments");
  }

  // We get an estimate of the total amount of the order in the currency of the payment method
  return getFxRate(order.currency, order.fromCollective.currency)
    .then(fxrate => {
      const totalAmountInPaymentMethodCurrency = order.totalAmount * fxrate;
      let orderAmountInfo = formatCurrency(order.totalAmount, order.currency);
      if (order.currency !== order.fromCollective.currency) {
        orderAmountInfo += ` ~= ${formatCurrency(totalAmountInPaymentMethodCurrency, order.fromCollective.currency)}`;
      }
      if (paymentMethod.monthlyLimitPerMember && totalAmountInPaymentMethodCurrency > paymentMethod.monthlyLimitPerMember) {
        throw new Error(`The total amount of this order (${orderAmountInfo}) is higher than your monthly spending limit on this payment method (${formatCurrency(paymentMethod.monthlyLimitPerMember, order.fromCollective.currency)})`);
      }
      return paymentMethod.getBalanceForUser(order.createdByUser, paymentMethod)
        .then(balance => {
          if (balance && totalAmountInPaymentMethodCurrency > balance.amount) {
            throw new Error(`You don't have enough funds available (${formatCurrency(balance.amount, balance.currency)} left) to execute this order (${orderAmountInfo})`)
          }
          return paymentMethod;
        })
      });
}

/**
 * Execute an order as user using paymentMethod
 * It validates the paymentMethod and makes sure the user can use it
 * @param {*} order { tier, description, totalAmount, currency, interval (null|month|year) }
 */
export const executeOrder = (user, order, paymentMethod) => {

  if (!order) {
    throw new Error("No order provided");
  }
  if (!paymentMethod) {
    return Promise.reject(new Error('paymentMethod missing in the order'));
  }
  if (order.processedAt) {
    return Promise.reject(new Error(`This order (#${order.id}) has already been processed at ${order.processedAt}`));
  }

  const payment = {
    amount: order.totalAmount,                  
    interval: order.interval, 
    currency: order.currency
  };

  validatePayment(payment);

  return order.populate()
    .then(() => models.PaymentMethod.getOrCreate(user, paymentMethod))
    .then(pm => validatePaymentMethodForOrder(order, pm))
    .then(paymentMethod => {
      order.paymentMethod = paymentMethod;
      order.update({ PaymentMethodId: paymentMethod.id });
      return paymentMethod;
    })
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
      return paymentProviders[paymentProvider].processOrder(order);
    })
    .then(transactions => {
      order.transactions = transactions;
      sendConfirmationEmail(order)
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

  const { toCollective, tier, interval } = order;
  const user = order.createdByUser;

  if (toCollective.type === types.EVENT) {
    return emailLib.send(
      'ticket.confirmed',
      user.email,
      { order: order.info,
        user: user.info,
        collective: toCollective.info,
        tier: tier.info
      }, {
        from: `${toCollective.name} <hello@${toCollective.slug}.opencollective.com>`
      })
  } else {
    // normal order
    return toCollective.getRelatedCollectives(2, 0)
    .then((relatedCollectives) => emailLib.send(
      'thankyou',
      user.email,
      { order: order.info,
        transaction: pick(order.transactions[0], ['createdAt', 'uuid']),
        user: user.info,
        collective: toCollective.info,
        relatedCollectives,
        interval,
        monthlyInterval: (interval === 'month'),
        firstPayment: true,
        subscriptionsLink: user.generateLoginLink('/subscriptions')
      },
      {
        from: `${toCollective.name} <hello@${toCollective.slug}.opencollective.com>`
      }
    ));
  }
}