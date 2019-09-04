import fetch from 'node-fetch';
import uuidV4 from 'uuid/v4';
import debugLib from 'debug';
import moment from 'moment';
import { map } from 'bluebird';
import { pick } from 'lodash';

import models from '../../models';
import status from '../../constants/order_status';
import * as paymentsLib from '../payments';

export function getNextDispatchingDate(interval, currentDispatchDate) {
  const nextDispatchDate = moment(currentDispatchDate);
  if (interval === 'month') {
    nextDispatchDate.add(1, 'months');
  } else if (interval === 'year') {
    nextDispatchDate.add(1, 'years');
  }
  return nextDispatchDate.toDate();
}

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
    uuid: uuidV4(),
    data: { HostCollectiveId: originalCreditTransaction.HostCollectiveId },
  });
}

export async function dispatchFunds(order) {
  const debug = debugLib('dispatch_prepaid_subscription');
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
        description: `Monthly donation to ${collective.name} through BackYourStack`,
        totalAmount,
        currency: order.currency,
        status: status.PENDING,
      };
      const orderCreated = await models.Order.create(orderData);

      await orderCreated.setPaymentMethod(paymentMethod);

      try {
        await paymentsLib.executeOrder(order.createdByUser, orderCreated, {
          skipPlatformFee: true,
          skipHostFee: true,
        });
      } catch (e) {
        debug(`Error occured excuting order ${orderCreated.id}`, e);
        throw e;
      }

      return orderCreated;
    },
    { concurrency: 3 },
  );
}
