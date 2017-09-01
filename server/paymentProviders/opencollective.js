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
        ToCollectiveId: paymentMethod.CollectiveId
      }
    })
    .then(result => {
      return result.dataValues;
    });
  },
  processOrder: (order) => {
    // Get the host of the fromCollective and toCollective
    return Promise.props({
      fromCollectiveHost: order.fromCollective.getHostCollective(),
      toCollectiveHost: order.toCollective.getHostCollective(),
    })
    .then(results => {
      if (results.fromCollectiveHost.id !== results.toCollectiveHost.id) {
        return Promise.reject(new Error(`Cannot transfer money between different hosts (${results.fromCollectiveHost.name} -> ${results.toCollectiveHost.name})`))
      }
      const payload = {
        CreatedByUserId: order.CreatedByUserId,
        FromCollectiveId: order.FromCollectiveId,
        ToCollectiveId: order.ToCollectiveId,
        paymentMethod: order.PaymentMethod
      };
      payload.transaction = {
        type: TransactionTypes.DONATION,
        OrderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        txnCurrency: results.toCollectiveHost.currency,
        amountInTxnCurrency: order.totalAmount,
        hostFeeInTxnCurrency: 0,
        platformFeeInTxnCurrency: 0,
        paymentProcessorFeeInTxnCurrency: 0,
        description: order.description,
      };
      return models.Transaction.createFromPayload(payload);
    })
  }
}