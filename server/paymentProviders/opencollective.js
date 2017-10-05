import models, { sequelize } from '../models';
import { type as TransactionTypes } from '../constants/transactions';
import Promise from 'bluebird';

export default {
  features: {
    recurring: false
  },
  getBalance: (paymentMethod) => {
    return models.Transaction.find({
      attributes: [
        [sequelize.fn('MAX', sequelize.col('currency')), 'currency'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0), 'amount']
      ],
      where: {
        CollectiveId: paymentMethod.CollectiveId
      }
    })
    .then(result => {
      return result.dataValues;
    });
  },
  processOrder: (order) => {
    // Get the host of the fromCollective and collective
    return Promise.props({
      fromCollectiveHost: order.fromCollective.getHostCollective(),
      collectiveHost: order.collective.getHostCollective(),
    })
    .then(results => {
      if (results.fromCollectiveHost.id !== results.collectiveHost.id) {
        return Promise.reject(new Error(`Cannot transfer money between different hosts (${results.fromCollectiveHost.name} -> ${results.collectiveHost.name})`))
      }
      const payload = {
        CreatedByUserId: order.CreatedByUserId,
        FromCollectiveId: order.FromCollectiveId,
        CollectiveId: order.CollectiveId,
        PaymentMethodId: order.PaymentMethodId
      };
      payload.transaction = {
        type: TransactionTypes.CREDIT,
        OrderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        hostCurrency: results.collectiveHost.currency,
        amountInHostCurrency: order.totalAmount,
        hostFeeInHostCurrency: 0,
        platformFeeInHostCurrency: 0,
        paymentProcessorFeeInHostCurrency: 0,
        description: order.description,
      };
      return models.Transaction.createFromPayload(payload);
    })
  }
}