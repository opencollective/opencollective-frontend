/** @module lib/subscriptions */

import config from 'config';
import moment from 'moment';
import { Op } from 'sequelize';

import models from '../models';
import emailLib from './email';
import * as paymentsLib from './payments';
import { getRecommendedCollectives } from './data';
import status from '../constants/order_status';

/** Maximum number of attempts before an order gets cancelled. */
export const MAX_RETRIES = 3;

/** Find all orders with subscriptions that are active & due.
 *
 * Subscriptions are considered due if their `nextChargeDate` is
 * already past.
 */
export async function ordersWithPendingCharges() {
  return models.Order.findAll({
    where: {
      SubscriptionId: { [Op.ne]: null },
      deletedAt: null,
    },
    include: [
      { model: models.User, as: 'createdByUser' },
      { model: models.Collective, as: 'collective' },
      { model: models.Collective, as: 'fromCollective' },
      { model: models.PaymentMethod, as: 'paymentMethod' },
      {
        model: models.Subscription,
        where: {
          isActive: true,
          deletedAt: null,
          deactivatedAt: null,
          activatedAt: { [Op.lte]: new Date() },
          nextChargeDate: { [Op.lte]: new Date() },
        },
      },
    ],
  });
}

function hasReachedQuantity(order) {
  return order.Subscription.chargeNumber !== null && order.Subscription.chargeNumber === order.Subscription.quantity;
}

/** Process order and trigger result handlers.
 *
 * Uses `lib.payments.processOrder()` to charge subscription and
 * handle both success and failure of that processing.
 */
export async function processOrderWithSubscription(options, order) {
  const csvEntry = {
    orderId: order.id,
    subscriptionId: order.Subscription.id,
    amount: order.totalAmount,
    from: order.fromCollective.slug,
    to: order.collective.slug,
    status: null,
    error: null,
    retriesBefore: order.Subscription.chargeRetryCount,
    retriesAfter: null,
    chargeDateBefore: dateFormat(order.Subscription.nextCharge),
    chargeDateAfter: null,
    nextPeriodStartBefore: dateFormat(order.Subscription.nextPeriodStart),
    nextPeriodStartAfter: null,
  };

  let orderProcessedStatus = 'unattempted';
  let collectiveIsArchived = false;
  let creditCardNeedsConfirmation = false;
  let transaction;

  if (!options.dryRun) {
    if (hasReachedQuantity(order)) {
      orderProcessedStatus = 'failure';
      csvEntry.error = 'Your subscription is over';
      cancelSubscription(order);
    } else if (order.collective.deactivatedAt) {
      // This means the collective has been archived and the subscription should be cancelled.
      orderProcessedStatus = 'failure';
      csvEntry.error = 'The collective has been archived';
      collectiveIsArchived = true;
      cancelSubscription(order);
    } else {
      try {
        transaction = await paymentsLib.processOrder(order);
        orderProcessedStatus = 'success';
      } catch (error) {
        if (error.stripeResponse && error.stripeResponse.paymentIntent) {
          creditCardNeedsConfirmation = true;
        }
        orderProcessedStatus = 'failure';
        csvEntry.error = error.message;
      }
      order.Subscription = Object.assign(
        order.Subscription,
        getNextChargeAndPeriodStartDates(orderProcessedStatus, order),
      );
      order.Subscription.chargeRetryCount = getChargeRetryCount(orderProcessedStatus, order);
      if (orderProcessedStatus === 'success' && order.Subscription.chargeNumber !== null) {
        order.Subscription.chargeNumber += 1;
        order.status = status.ACTIVE;
      }
    }
  }

  csvEntry.status = orderProcessedStatus;
  csvEntry.retriesAfter = order.Subscription.chargeRetryCount;
  csvEntry.chargeDateAfter = dateFormat(order.Subscription.nextChargeDate);
  csvEntry.nextPeriodStartAfter = dateFormat(order.Subscription.nextPeriodStart);

  if (!options.dryRun) {
    try {
      if (collectiveIsArchived) {
        await sendArchivedCollectiveEmail(order);
      } else if (creditCardNeedsConfirmation) {
        await sendCreditCardConfirmationEmail(order);
      } else {
        await handleRetryStatus(order, transaction);
      }
    } catch (error) {
      console.log(`Error notifying order #${order.id} ${error}`);
    } finally {
      await order.Subscription.save();
      await order.save();
    }
  }

  return csvEntry;
}

/** Standard way to format dates in this script */
function dateFormat(date) {
  return moment(date).format();
}

/** Handle processing result.
 *
 * The result of processing an order is stored within the field
 * `chargeRetryCount`. This function handles the following values for
 * this variable:
 *
 *   1. zero(0): Means success. The counter was reset after a
 *      successful processing.
 *
 *   2. MAX_RETRIES: The order will be cancelled because it reached
 *      the maximum number of retries and the payment method doesn't
 *      work.
 *
 *   3. WARN_USER: The last attempt failed. Warn user about the
 *      failure and allow them to update the payment method.
 */
export async function handleRetryStatus(order, transaction) {
  switch (order.Subscription.chargeRetryCount) {
    case 0:
      await sendThankYouEmail(order, transaction);
      break;
    case MAX_RETRIES:
      await cancelSubscriptionAndNotifyUser(order);
      break;
    default:
      await sendFailedEmail(order, false);
      break;
  }
}

/** Get the date an order should be charged again and it's next period start date
 *
 * The status defines how much time it will take until the same
 * subscription can be charged again. Currently supported status
 * values:
 *
 *   0. new: 1st day of the next month for monthly, 1st day of the
 *      same month of the next year for yearly.
 *   1. success: Increment date by 1 month for monthly or 1 year for
 *      yearly subscriptions
 *   2. failure: Two days after today.
 */
export function getNextChargeAndPeriodStartDates(status, order) {
  const initial = order.Subscription.nextPeriodStart || order.Subscription.createdAt;
  let nextChargeDate = moment(initial);
  const response = {};
  if (status === 'new' || status === 'success') {
    if (order.Subscription.interval === 'month') {
      nextChargeDate.add(1, 'months');
    } else if (order.Subscription.interval === 'year') {
      nextChargeDate.add(1, 'years');
    }
    if (status === 'new') {
      nextChargeDate.startOf('month');
    }
    response.nextPeriodStart = nextChargeDate.toDate();
  } else if (status === 'failure') {
    nextChargeDate = moment(new Date()).add(2, 'days');
  } else if (status === 'updated') {
    // used when user updates payment method
    nextChargeDate = moment(new Date()); // sets next charge date to now
  }
  response.nextChargeDate = nextChargeDate.toDate();
  return response;
}

/** Update counter that records retry attempts.
 *
 * When status is 'failure', `order.Subscription.chargeRetryCount` is
 * incremented by one. The counter is reset to zero if the status is
 * 'success'.
 */
export function getChargeRetryCount(status, order) {
  return status === 'success' || status === 'updated' ? 0 : order.Subscription.chargeRetryCount + 1;
}

/** Cancel subscription
 *
 * The `isActive` field will be set to false and the field
 * `deactivatedAt` will be updated with the current time.
 *
 * Notice that this function doesn't save the changes to the database
 * so a call to `order.Subscription.save()` is required after this
 * function.
 */
export function cancelSubscription(order) {
  order.Subscription.isActive = false;
  order.Subscription.deactivatedAt = new Date();
  order.status = status.CANCELLED;
}

/** Group processed orders by their state
 *
 * This function groups a list of entries returned by the function
 * `processOrderWithSubscription()`. Although they do contain
 * information about the order processing, be aware that they aren't
 * really model instances.
 *
 * There are two variables within each entry that decide which group
 * they're going to belong to:
 *
 *  1. entry.status: If it's `success` then the entry is automatically
 *     categorized within the group `charged`. If the value of this
 *     field is `failure`, the other variable will be used in the
 *     decision.
 *
 *  2. entry.retriesAfter: If that's less than MAX_RETRIES than the
 *     entry is grouped under `past_due`. Otherwise, it's marked as
 *     `canceled`.
 */
export function groupProcessedOrders(orders) {
  return orders.reduce((map, value) => {
    const key = value.status === 'success' ? 'charged' : value.retriesAfter >= MAX_RETRIES ? 'canceled' : 'past_due';
    const group = map.get(key);
    if (group) {
      group.total += value.amount;
      group.entries.push(value);
    } else {
      map.set(key, {
        total: value.amount,
        entries: [value],
      });
    }
    return map;
  }, new Map());
}

/** Call cancelation function and then send confirmation email */
export async function cancelSubscriptionAndNotifyUser(order) {
  cancelSubscription(order);
  return sendFailedEmail(order, true);
}

/** Send `archived.collective` email */
export async function sendArchivedCollectiveEmail(order) {
  const user = order.createdByUser;
  return emailLib.send(
    'archived.collective',
    user.email,
    {
      order: order.info,
      collective: order.collective.info,
      fromCollective: order.fromCollective.minimal,
      subscriptionsLink: user.generateLoginLink(`/${order.fromCollective.slug}/subscriptions`),
    },
    {
      from: `${order.collective.name} <hello@${order.collective.slug}.opencollective.com>`,
    },
  );
}

/** Send `payment.failed` email */
export async function sendFailedEmail(order, lastAttempt) {
  const user = order.createdByUser;
  return emailLib.send(
    'payment.failed',
    user.email,
    {
      lastAttempt,
      order: order.info,
      collective: order.collective.info,
      fromCollective: order.fromCollective.minimal,
      subscriptionsLink: `${config.host.website}/${order.fromCollective.slug}/subscriptions`,
    },
    {
      from: `${order.collective.name} <hello@${order.collective.slug}.opencollective.com>`,
    },
  );
}

/** Send `thankyou` email */
export async function sendThankYouEmail(order, transaction) {
  const relatedCollectives = await order.collective.getRelatedCollectives(3, 0);
  const recommendedCollectives = await getRecommendedCollectives(order.collective, 3);
  const user = order.createdByUser;
  return emailLib.send(
    'thankyou',
    user.email,
    {
      order: order.info,
      transaction: transaction.info,
      user: user.info,
      firstPayment: false,
      collective: order.collective.info,
      fromCollective: order.fromCollective.minimal,
      relatedCollectives,
      recommendedCollectives,
      config: { host: config.host },
      interval: order.Subscription.interval,
      subscriptionsLink: `${config.host.website}/${order.fromCollective.slug}/subscriptions`,
    },
    {
      from: `${order.collective.name} <hello@${order.collective.slug}.opencollective.com>`,
    },
  );
}

export async function sendCreditCardConfirmationEmail(order) {
  const user = order.createdByUser;
  return emailLib.send(
    'payment.creditcard.confirmation',
    user.email,
    {
      order: order.info,
      collective: order.collective.info,
      fromCollective: order.fromCollective.minimal,
      confirmOrderLink: `${config.host.website}/order/${order.id}/confirm`,
    },
    {
      from: `${order.collective.name} <hello@${order.collective.slug}.opencollective.com>`,
    },
  );
}
