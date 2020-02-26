import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';
import debugLib from 'debug';
import moment from 'moment';
import { map } from 'bluebird';
import { pick } from 'lodash';

import models from '../../models';
import status from '../../constants/order_status';
import activities from '../../constants/activities';
import * as paymentsLib from '../payments';

const debug = debugLib('backyourstack');

export function needsDispatching(nextDispatchDate) {
  const needs = moment(nextDispatchDate).isSameOrBefore();
  return needs;
}

function computeAmount(totalAmount, sumOfWeights, dependencyWeight) {
  // Express each weight as percentage
  const percentage = (dependencyWeight / sumOfWeights) * 100;
  return Math.floor((percentage / 100) * totalAmount);
}

function fetchDependencies(jsonUrl) {
  return fetch(jsonUrl).then(res => res.json());
}

async function createPaymentMethod(originalCreditTransaction) {
  const shareableAmount =
    originalCreditTransaction.amountInHostCurrency +
    originalCreditTransaction.hostFeeInHostCurrency +
    originalCreditTransaction.platformFeeInHostCurrency +
    originalCreditTransaction.paymentProcessorFeeInHostCurrency;

  const paymentMethodTransaction = {
    ...pick(originalCreditTransaction, ['currency', 'hostCurrency', 'CreatedByUserId']),
    description: 'BackYourStack dispatch Payment Method',
    amount: shareableAmount,
    CollectiveId: originalCreditTransaction.FromCollectiveId,
    FromCollectiveId: originalCreditTransaction.CollectiveId,
    paymentProcessorFeeInHostCurrency: 0,
    platformFeeInHostCurrency: 0,
    hostFeeInHostCurrency: 0,
  };

  await models.Transaction.createDoubleEntry(paymentMethodTransaction);

  return models.PaymentMethod.create({
    initialBalance: shareableAmount,
    currency: originalCreditTransaction.currency,
    CollectiveId: originalCreditTransaction.FromCollectiveId,
    name: 'BackYourStack dispatch Payment Method',
    service: 'opencollective',
    type: 'prepaid',
    uuid: uuid(),
    data: {
      HostCollectiveId: originalCreditTransaction.HostCollectiveId,
      hidden: true,
    },
  });
}

export async function dispatchFunds(order) {
  // Amount shareable amongst dependencies
  const transaction = await models.Transaction.findOne({
    where: { OrderId: order.id, type: 'CREDIT' },
  });

  const originalCreditTransaction = await models.Transaction.findOne({
    where: { OrderId: order.id, type: 'CREDIT' },
  });

  const shareableAmount = transaction.netAmountInCollectiveCurrency;

  const collectives = [];

  let depRecommendations;
  try {
    if (!order.data.customData.jsonUrl) {
      throw new Error('Unable to fetch dependencies, no attached jsonUrl.');
    }
    depRecommendations = await fetchDependencies(order.data.customData.jsonUrl);
  } catch (err) {
    debug('Error fetching dependencies', err);
    console.error(err);
    throw new Error('Unable to fetch dependencies, check jsonUrl.');
  }

  for (const depRecommended of depRecommendations) {
    const collective = await models.Collective.findOne({ where: { slug: depRecommended.opencollective.slug } });
    if (!collective) {
      debug(`Unable to fetch collective with slug ${depRecommended.opencollective.slug}`);
      continue;
    }
    if (collective.HostCollectiveId !== originalCreditTransaction.HostCollectiveId) {
      debug(`${depRecommended.opencollective.slug} is not hosted by the same host (Open Source Collective).`);
      continue;
    }
    collective.weight = depRecommended.weight;
    collectives.push(collective);
  }

  const sumOfWeights = collectives.reduce((sum, dependency) => dependency.weight + sum, 0);

  if (!order.fromCollective) {
    order.fromCollective = await models.Collective.findByPk(order.FromCollectiveId);
  }
  if (!order.createdByUser) {
    order.createdByUser = await models.User.findByPk(order.CreatedByUserId);
  }

  const paymentMethod = await createPaymentMethod(originalCreditTransaction);

  return map(
    collectives,
    async collective => {
      const totalAmount = computeAmount(shareableAmount, sumOfWeights, collective.weight);
      const orderData = {
        CreatedByUserId: order.CreatedByUserId,
        FromCollectiveId: order.FromCollectiveId,
        CollectiveId: collective.id,
        quantity: order.quantity,
        description: `Monthly financial contribution to ${collective.name} through BackYourStack`,
        totalAmount,
        currency: order.currency,
        status: status.PENDING,
      };
      const orderCreated = await models.Order.create(orderData);

      await orderCreated.setPaymentMethod(paymentMethod);

      try {
        await paymentsLib.executeOrder(order.createdByUser, orderCreated);
      } catch (e) {
        debug(`Error occured excuting order ${orderCreated.id}`, e);
        throw e;
      }

      return orderCreated;
    },
    { concurrency: 3 },
  );
}

export async function dispatch(order, subscription) {
  try {
    const dispatchedOrders = await dispatchFunds(order);
    // update subscription next dispatch date
    if (dispatchedOrders) {
      subscription.data = {
        nextDispatchDate: subscription.nextChargeDate,
      };
      await subscription.save();
    }
    const collective = await models.Collective.findByPk(order.FromCollectiveId);
    // send confirmation email to collective admins
    await models.Activity.create({
      type: activities.BACKYOURSTACK_DISPATCH_CONFIRMED,
      UserId: order.CreatedByUserId,
      CollectiveId: collective.id,
      data: {
        orders: dispatchedOrders,
        collective: collective.info,
      },
    });
  } catch (err) {
    console.log('>>>> Background dispatch failed');
    console.error(err);
  }
}
