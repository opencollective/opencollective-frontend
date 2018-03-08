import models, { sequelize } from '../../models';
import { type as TransactionTypes } from '../../constants/transactions';
import Promise from 'bluebird';
import { getFxRate } from '../../lib/currency';
import * as paymentsLib from '../../lib/payments';

export default {
  features: {
    recurring: false,
    waitToCharge: false
  },
  // Returns the balance in the currency of the paymentMethod (ie. currency of the Collective)
  getBalance: (paymentMethod) => {
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
  },
  processOrder: (order, options = {}) => {
    // Get the host of the fromCollective and collective
    return Promise.props({
      fromCollectiveHost: order.fromCollective.getHostCollective(),
      collectiveHost: order.collective.getHostCollective(),
    })
    .then(results => {

      const hostFeePercent = options.hostFeePercent || 0;
      const platformFeePercent = options.platformFeePercent || 0;

      if (!results.fromCollectiveHost) {
        // If the fromCollective has no Host (ie. when we add fund on behalf of a user/organization),
        // we check if the payment method belongs to the Host of the Order.collective (aka add funds)
        if (order.collective.HostCollectiveId !== order.paymentMethod.CollectiveId) {
          return Promise.reject(new Error(`You need to use the payment method of the host (${order.collective.HostCollectiveId}) to add funds to this collective`));
        }
      } else if (results.fromCollectiveHost.id !== results.collectiveHost.id) {
        return Promise.reject(new Error(`Cannot transfer money between different hosts (${results.fromCollectiveHost.name} -> ${results.collectiveHost.name})`))
      }
      const payload = {
        CreatedByUserId: order.CreatedByUserId,
        FromCollectiveId: order.FromCollectiveId,
        CollectiveId: order.CollectiveId,
        PaymentMethodId: order.PaymentMethodId
      };
      // Different collectives on the same host may have different currencies
      // That's bad design. We should always keep the same host currency everywhere and only use the currency
      // of the collective for display purposes (using the fxrate at the time of display)
      // Anyway, until we change that, when we give money to a collective that has a different currency
      // we need to compute the equivalent using the fxrate of the day
      return getFxRate(order.currency, order.paymentMethod.currency)
      .then(fxrate => {
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
          hostCurrency: results.collectiveHost.currency,
          hostCurrencyFxRate: 1/fxrate,
          netAmountInCollectiveCurrency: order.totalAmount * (1 - hostFeePercent/100),
          amountInHostCurrency: totalAmountInPaymentMethodCurrency,
          hostFeeInHostCurrency,
          platformFeeInHostCurrency,
          paymentProcessorFeeInHostCurrency: 0,
          description: order.description,
        };
        return models.Transaction.createFromPayload(payload);
      });
    })
  }
}
