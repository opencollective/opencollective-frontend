import Promise from 'bluebird';
import { includes, pick, get } from 'lodash';

import models from '../models';
import emailLib from './email';
import { types } from '../constants/collectives';
import paymentProviders from '../paymentProviders';
import * as libsubscription from './subscriptions';

export async function processOrder(order, options) {
  const provider = order.paymentMethod ? order.paymentMethod.service : 'manual';
  const methodType = order.paymentMethod.type || 'default';
  const method = paymentProviders[provider].types[methodType]; // eslint-disable-line import/namespace
  return await method.processOrder(order, options);
}

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
        return models.Subscription.create(payment).then(subscription => {
          // The order instance doesn't have the Subscription field
          // here because it was just created and no models were
          // included so we're doing that manually here. Not the
          // cutest but works.
          order.Subscription = subscription;
          libsubscription.updateNextChargeDate('new', order); // No DB access
          return subscription.save();
        }).then((subscription) => {
          return order.update({ SubscriptionId: subscription.id });
        })
      }
    })
    .then(() => {
      return processOrder(order, options)
        .tap(async () => {
          if (!order.matchingFund) return;
          const matchingFundCollective = await models.Collective.findById(order.matchingFund.CollectiveId);
          // if there is a matching fund, we execute the order
          // also adds the owner of the matching fund as a BACKER of collective
          const matchingOrder = {
            ...pick(order, ['id', 'collective', 'tier', 'currency']),
            totalAmount: order.totalAmount * order.matchingFund.matching,
            paymentMethod: order.matchingFund,
            FromCollectiveId: order.matchingFund.CollectiveId,
            fromCollective: matchingFundCollective,
            description: `Matching ${order.matchingFund.matching}x ${order.fromCollective.name}'s donation`,
            createdByUser: await matchingFundCollective.getUser()
          };

          // processOrder expects an update function to update `order.processedAt`
          matchingOrder.update = () => {};

          return paymentProviders[order.paymentMethod.service].types[order.paymentMethod.type || 'default'].processOrder(matchingOrder, options) // eslint-disable-line import/namespace
            .then(transaction => {
              sendOrderConfirmedEmail({
                ...order,
                transaction
              });
            })
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
      return transaction;
    })
    .tap(async (transaction) => {
      // Credit card charges are synchronous. If the transaction is
      // created here it means that the payment went through so it's
      // safe to enable subscriptions after this.
      if (payment.interval && transaction) await order.Subscription.activate();
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
    return emailLib.send('ticket.confirmed', user.email,
      {
        order: pick(order, ['totalAmount', 'currency', 'createdAt', 'quantity']),
        user: user.info,
        recipient: { name: fromCollective.name },
        collective: collective.info,
        tier: tier.info
      },
      {
        from: `${collective.name} <hello@${collective.slug}.opencollective.com>`
      });
  } else {
    // normal order
    const relatedCollectives = await collective.getRelatedCollectives(2, 0);
    const emailOptions = { from: `${collective.name} <hello@${collective.slug}.opencollective.com>` };
    const data = {
      order: pick(order, ['totalAmount', 'currency', 'createdAt']),
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

    let matchingFundCollective;
    if (order.matchingFund) {
      matchingFundCollective = await models.Collective.findById(order.matchingFund.CollectiveId)
      data.matchingFund = {
        collective: pick(matchingFundCollective, ['slug', 'name', 'image']),
        matching: order.matchingFund.matching,
        amount: order.matchingFund.matching * order.totalAmount
      }
    }

    // sending the order confirmed email to the matching fund owner or to the donor
    if (get(order, 'transaction.FromCollectiveId') === get(order, 'matchingFund.CollectiveId')) {
      order.matchingFund.info;
      const recipients = await matchingFundCollective.getEmails();
      emailLib.send('donationmatched', recipients, data, emailOptions)
    } else {
      emailLib.send('thankyou', user.email, data, emailOptions)
    }
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
