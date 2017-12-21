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
 * @param options { hostFeePercent, platformFeePercent} (only for add funds and if remoteUser is admin of host or root)
 */
export const executeOrder = (user, order, options) => {

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
      return paymentProviders[paymentProvider].types[order.paymentMethod.type || 'default'].processOrder(order, options)  // eslint-disable-line import/namespace
        .tap(async () => {
          if (!order.matchingFund) return;
          // if there is a matching fund, we execute the order
          // also adds the owner of the matching fund as a BACKER of collective
          order.paymentMethod = order.matchingFund;
          order.totalAmount = order.totalAmount * order.matchingFund.matching;
          order.FromCollectiveId = order.matchingFund.CollectiveId;
          order.description = `Matching ${order.matchingFund.matching}x ${order.fromCollective.name}'s donation`;
          order.interval = null; // we only match the first donation (don't create another subscription)
          return paymentProviders[order.paymentMethod.service].types[order.paymentMethod.type || 'default'].processOrder(order, options) // eslint-disable-line import/namespace
        });
    })
    .then(transaction => {
      // for gift cards
      if (!transaction && order.paymentMethod.service === 'opencollective' && order.paymentMethod.type === 'prepaid') {
        sendOrderProcessingEmail(order)
        .then(() => sendSupportEmailForManualIntervention(order)); // async
      } else if (!transaction && order.paymentMethod.service === 'stripe' && order.paymentMethod.type === 'bitcoin') {
        sendOrderProcessingEmail(order); // async
      } else {
        order.transaction = transaction;
        sendOrderConfirmedEmail(order); // async
      }
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

const sendOrderConfirmedEmail = async (order) => {

  const { collective, tier, interval, fromCollective } = order;
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
    const relatedCollectives = await collective.getRelatedCollectives(2, 0);
    const emailOptions = { from: `${collective.name} <hello@${collective.slug}.opencollective.com>` };
    const data = { order: order.info,
      transaction: pick(order.transaction, ['createdAt', 'uuid']),
      user: user.info,
      collective: collective.info,
      fromCollective: fromCollective.minimal,
      interval,
      relatedCollectives,
      monthlyInterval: (interval === 'month'),
      firstPayment: true,
      subscriptionsLink: interval && user.generateLoginLink('/subscriptions')
    };

    if (order.matchingFund) {
      const matchingFundCollective = await models.Collective.findById(order.matchingFund.CollectiveId)
      data.matchingFund = {
        collective: pick(matchingFundCollective, ['slug', 'name', 'image']),
        matching: order.matchingFund.matching,
        amount: order.matchingFund.matching * order.totalAmount
      }
      order.matchingFund.info;
      if (order.matchingFund.id === order.paymentMethod.id) {
        const recipients = await matchingFundCollective.getEmails();
        emailLib.send('donationmatched', recipients, data, emailOptions)
      }
    }
    emailLib.send('thankyou', user.email, data, emailOptions)
  }
}

const sendSupportEmailForManualIntervention = (order) => {
  const user = order.createdByUser;
  return emailLib.sendMessage(
    'support@opencollective.com', 
    'Gift card order needs manual attention', 
    null, 
    { text: `Order Id: ${order.id} by userId: ${user.id}`});
}

// Assumes one-time payments, 
const sendOrderProcessingEmail = (order) => {
    const { collective, fromCollective } = order;
  const user = order.createdByUser;

  return emailLib.send(
      'processing',
      user.email,
      { order: order.info,
        user: user.info,
        collective: collective.info,
        fromCollective: fromCollective.minimal,
        subscriptionsLink: user.generateLoginLink('/subscriptions')
      }, {
        from: `${collective.name} <hello@${collective.slug}.opencollective.com>`
      })
}
