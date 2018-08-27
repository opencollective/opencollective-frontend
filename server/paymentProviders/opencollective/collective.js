import models, { sequelize } from '../../models';
import { TransactionTypes } from '../../constants/transactions';
import Promise from 'bluebird';
import { getFxRate } from '../../lib/currency';
import * as paymentsLib from '../../lib/payments';
import { formatCurrency } from '../../lib/utils';
import roles from '../../constants/roles';

const paymentMethodProvider = {};


paymentMethodProvider.features = {
  recurring: true,
  waitToCharge: false
};

// Returns the balance in the currency of the paymentMethod (ie. currency of the Collective)
paymentMethodProvider.getBalance = (paymentMethod) => {
  return paymentMethod.getCollective()
  .then(collective => {

    // For gift cards turned into opencollective credit
    // overloaded 'monthlyLimitPerMember' to use as a one-time limit
    if (paymentMethod.monthlyLimitPerMember) {
      return models.Transaction.find({
        attributes: [
          [ sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0), 'amount' ]
        ],
        where: {
          PaymentMethodId: paymentMethod.Id,
          FromCollectiveId: paymentMethod.CollectiveId
        }
      })
      .then(result => Promise.resolve(paymentMethod.monthlyLimitPerMember - result.dataValues.amount))
    }

    // If the collective is a host (USER or ORGANIZATION)
    if (collective.type === 'ORGANIZATION' || collective.type === 'USER') {
      return collective.isHost()
        .then(isHost => {
          if (!isHost) return 0;
          else return 10000000; // GraphQL doesn't like Infinity
        });
    }

    // Otherwise we compute the balance based on all previous transactions for this collective
    return models.Transaction.find({
      attributes: [
        [ sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0), 'amount' ]
      ],
      where: {
        CollectiveId: paymentMethod.CollectiveId
      }
    })
    .then(result => {
      return result.dataValues.amount;
    });
  });
};

paymentMethodProvider.processOrder = async (order, options = {}) => {
  // Get the host of the fromCollective and collective
  const fromCollectiveHost = await order.fromCollective.getHostCollective();
  const collectiveHost = await order.collective.getHostCollective();

  // If the paymentMethod is the one of the host to make a payment on behalf of another of its collective,
  // we need to use the payment method of the fromCollective (to make sure it has enough funds)
  if (fromCollectiveHost && order.paymentMethod.CollectiveId === fromCollectiveHost.id && fromCollectiveHost.id === collectiveHost.id) {
    order.paymentMethod = await models.PaymentMethod.findOne({ where: { CollectiveId: order.fromCollective.id }});
    // We need to recheck the balance
    const balance = await paymentMethodProvider.getBalance(order.paymentMethod);
    if (balance < order.totalAmount) {
      throw new Error(`You don't have enough funds available (${formatCurrency(balance, order.paymentMethod.currency)} left) to execute this order (${formatCurrency(order.totalAmount, order.currency)})`);
    }
  }

  if (order.paymentMethod.CollectiveId !== order.fromCollective.id && order.fromCollective.type === 'COLLECTIVE') {
    throw new Error(`Cannot use an opencollective payment method to make a payment on behalf of another collective`);
  }

  const hostFeePercent = options.hostFeePercent || 0;
  const platformFeePercent = options.platformFeePercent || 0;

  if (!fromCollectiveHost) {
    // If the fromCollective has no Host (ie. when we add fund on behalf of a user/organization),
    // we check if the payment method belongs to the Host of the Order.collective (aka add funds)
    if (order.collective.HostCollectiveId !== order.paymentMethod.CollectiveId) {
      throw new Error(`You need to use the payment method of the host (${order.collective.HostCollectiveId}) to add funds to this collective`);
    }
    // If Hosts are not the same, then check if both have the same currency collectives
    // and also both hosts of these collectives have the same currency as well
    // then look for fromCollectiveHost Credit Card
    // and create transaction through the paymentLib Process order
  } else if (fromCollectiveHost.id !== collectiveHost.id) {
    const fromCollectiveHost = await order.fromCollective.getHostCollective();
    const collectiveHost = await order.collective.getHostCollective();
    // Check if collectives have the same currency
    if (order.fromCollective.currency !== order.collective.currency) {
      throw new Error(`Payments Across hosts are only allowed when both Collectives have the same currency. Collective ${order.collective.name}` +
        ` is ${order.collective.currency} and ${order.fromCollective.name} is ${order.fromCollective.currency}.`);
    }
    // Check if Hosts have the same currency as well
    if (fromCollectiveHost.currency !== collectiveHost.currency) {
      throw new Error(`Payment Across Hosts are only allowed when both Hosts have the same currency. Host ${fromCollectiveHost.name}` +
        ` is ${fromCollectiveHost.currency} and ${collectiveHost.name} is ${collectiveHost.currency}.`);
    }
    // try to find a credit card for the fromCollectiveHost
    const fromCollectiveHostPaymentMethod = await models.PaymentMethod.findOne({
      where: {
        CollectiveId: fromCollectiveHost.id,
        type: 'creditcard'
      }
    });
    if (!fromCollectiveHostPaymentMethod) {
      throw new Error(`Host ${fromCollectiveHost.name} needs to add a credit card to send money to a different host (${collectiveHost.name}).`);
    }
    // Change paymentMethod to use credit card instead of collective
    order.paymentMethod = fromCollectiveHostPaymentMethod;
    // setting order platform fee to 0 in cross-host transactions
    order.platformFee = 0;
    return paymentsLib.processOrder(order);
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

  const hostFeeInHostCurrency = paymentsLib.calcFee(
    order.totalAmount * fxrate,
    hostFeePercent);

  const platformFeeInHostCurrency = paymentsLib.calcFee(
    order.totalAmount * fxrate,
    platformFeePercent);

  payload.transaction = {
    type: TransactionTypes.CREDIT,
    OrderId: order.id,
    amount: order.totalAmount,
    currency: order.currency,
    hostCurrency: collectiveHost.currency,
    hostCurrencyFxRate: fxrate,
    netAmountInCollectiveCurrency: order.totalAmount * (1 - hostFeePercent/100),
    amountInHostCurrency: totalAmountInPaymentMethodCurrency,
    hostFeeInHostCurrency,
    platformFeeInHostCurrency,
    paymentProcessorFeeInHostCurrency: 0,
    description: order.description,
  };

  const transactions = await models.Transaction.createFromPayload(payload);

  const CollectiveId = order.fromCollective.id;
  const CreatedByUserId = order.createdByUser.id;
  await order.collective.findOrAddUserWithRole({ id: CreatedByUserId, CollectiveId }, roles.BACKER, { CreatedByUserId, TierId: order.TierId });

  return transactions;
};

export default paymentMethodProvider;
