import Promise from 'bluebird';
import { get } from 'lodash';

import logger from '../../lib/logger';
import models, { sequelize } from '../../models';
import { TransactionTypes } from '../../constants/transactions';
import { getFxRate } from '../../lib/currency';
import * as paymentsLib from '../../lib/payments';
import { formatCurrency } from '../../lib/utils';
import { maxInteger } from '../../constants/math';

const paymentMethodProvider = {};

paymentMethodProvider.features = {
  recurring: true,
  waitToCharge: false,
};

// Returns the balance in the currency of the paymentMethod (ie. currency of the Collective)
paymentMethodProvider.getBalance = paymentMethod => {
  return paymentMethod.getCollective().then(collective => {
    // For gift cards turned into opencollective credit
    // overloaded 'monthlyLimitPerMember' to use as a one-time limit
    if (paymentMethod.monthlyLimitPerMember) {
      return models.Transaction.findOne({
        attributes: [
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0), 'amount'],
        ],
        where: {
          PaymentMethodId: paymentMethod.Id,
          FromCollectiveId: paymentMethod.CollectiveId,
        },
      }).then(result => Promise.resolve(paymentMethod.monthlyLimitPerMember - result.dataValues.amount));
    }

    // If the collective is a host (USER or ORGANIZATION)
    if (collective.type === 'ORGANIZATION' || collective.type === 'USER') {
      return collective.isHost().then(isHost => {
        if (!isHost) {
          return 0;
        } else {
          return maxInteger;
        } // GraphQL doesn't like Infinity
      });
    }

    // Otherwise we compute the balance based on all previous transactions for this collective
    return models.Transaction.findOne({
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0), 'amount'],
      ],
      where: {
        CollectiveId: paymentMethod.CollectiveId,
      },
    }).then(result => {
      return result.dataValues.amount;
    });
  });
};

paymentMethodProvider.processOrder = async order => {
  // Get the host of the fromCollective and collective
  const fromCollectiveHost = await order.fromCollective.getHostCollective();
  const collectiveHost = await order.collective.getHostCollective();

  // If the paymentMethod is the one of the host to make a payment on behalf of another of its collective,
  // we need to use the payment method of the fromCollective (to make sure it has enough funds)
  if (
    fromCollectiveHost &&
    order.paymentMethod.CollectiveId === fromCollectiveHost.id &&
    fromCollectiveHost.id === collectiveHost.id
  ) {
    // Defensive code that might be deleted if not used. Check the logs.
    if (!order.paymentMethod) {
      logger.warn('opencollective.collective.processOrder: no paymentMethod set in order');
      order.paymentMethod = await models.PaymentMethod.findOne({
        where: { CollectiveId: order.fromCollective.id },
      });
    }
    // We need to recheck the balance
    const balance = await paymentMethodProvider.getBalance(order.paymentMethod);
    // FIXME: balance and totalAmount should be tested according to their respective currencies
    // https://github.com/opencollective/opencollective/issues/1634
    if (balance < order.totalAmount) {
      throw new Error(
        `You don't have enough funds available (${formatCurrency(
          balance,
          order.paymentMethod.currency,
        )} left) to execute this order (${formatCurrency(order.totalAmount, order.currency)})`,
      );
    }
  }

  if (order.paymentMethod.CollectiveId !== order.fromCollective.id && order.fromCollective.type === 'COLLECTIVE') {
    throw new Error('Cannot use the opencollective payment method to make a payment on behalf of another collective');
  }

  const hostFeePercent = get(order, 'data.hostFeePercent', 0);
  const platformFeePercent = get(order, 'data.platformFeePercent', 0);

  if (!fromCollectiveHost) {
    // If the fromCollective has no Host (ie. when we add fund on behalf of a user/organization),
    // we check if the payment method belongs to the Host of the Order.collective (aka add funds)
    if (order.collective.HostCollectiveId !== order.paymentMethod.CollectiveId) {
      throw new Error(
        `You need to use the payment method of the host (${order.collective.HostCollectiveId}) to add funds to this collective`,
      );
    }
  } else if (fromCollectiveHost.id !== collectiveHost.id) {
    // NOTE: this used to be supported, check git history if you want to understand why and how
    throw new Error(
      `Cannot use the opencollective payment method to make a payment between different hosts: ${fromCollectiveHost.name} -> ${collectiveHost.name}`,
    );
  }

  const payload = {
    CreatedByUserId: order.CreatedByUserId,
    FromCollectiveId: order.FromCollectiveId,
    CollectiveId: order.CollectiveId,
    PaymentMethodId: order.PaymentMethodId,
  };

  // Different collectives on the same host may have different currencies
  // That's bad design. We should always keep the same host currency everywhere and only use the currency
  // of the collective for display purposes (using the fxrate at the time of display)
  // Anyway, until we change that, when we give money to a collective that has a different currency
  // we need to compute the equivalent using the fxrate of the day
  const fxrate = await getFxRate(order.currency, order.paymentMethod.currency);
  const totalAmountInPaymentMethodCurrency = order.totalAmount * fxrate;

  const hostFeeInHostCurrency = paymentsLib.calcFee(order.totalAmount * fxrate, hostFeePercent);

  const platformFeeInHostCurrency = paymentsLib.calcFee(order.totalAmount * fxrate, platformFeePercent);

  payload.transaction = {
    type: TransactionTypes.CREDIT,
    OrderId: order.id,
    amount: order.totalAmount,
    currency: order.currency,
    hostCurrency: collectiveHost.currency,
    hostCurrencyFxRate: fxrate,
    netAmountInCollectiveCurrency: order.totalAmount * (1 - hostFeePercent / 100),
    amountInHostCurrency: totalAmountInPaymentMethodCurrency,
    hostFeeInHostCurrency,
    platformFeeInHostCurrency,
    taxAmount: order.taxAmount,
    paymentProcessorFeeInHostCurrency: 0,
    description: order.description,
  };

  const transactions = await models.Transaction.createFromPayload(payload);

  return transactions;
};

/**
 * Refund a given transaction by creating the opposing transaction. We don't support
 * refunds if for cross-host donations (that we stopped supporting for now).
 */
paymentMethodProvider.refundTransaction = async (transaction, user) => {
  // Get the from/to collectives.
  const collectives = await Promise.all([
    models.Collective.findByPk(transaction.FromCollectiveId),
    models.Collective.findByPk(transaction.CollectiveId),
  ]);

  const [fromCollective, collective] =
    transaction.type === TransactionTypes.CREDIT ? collectives : collectives.reverse();

  // Check if we allow refund for this one
  if (!fromCollective.HostCollectiveId) {
    throw new Error('Cannot process refunds for collectives without a host');
  } else if (fromCollective.HostCollectiveId !== collective.HostCollectiveId) {
    throw new Error('Cannot process refunds for collectives with different hosts');
  } else if ((await collective.getBalance()) < transaction.amount) {
    throw new Error("The collective doesn't have enough funds to process this refund");
  }

  // Use 0 for processor fees because there's no fees for collective to collective
  // transactions within the same host.
  const refundTransaction = await paymentsLib.createRefundTransaction(transaction, 0, null, user);
  return paymentsLib.associateTransactionRefundId(transaction, refundTransaction);
};

export default paymentMethodProvider;
