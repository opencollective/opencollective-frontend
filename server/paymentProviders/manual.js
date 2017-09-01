import models from '../models';
import { type as TransactionTypes } from '../constants/transactions';
import roles from '../constants/roles';

export default {
  features: {
    recurring: false
  },
  processOrder: (order) => {
    const collective = order.toCollective;
    const user = order.createdByUser;

    let isFromCollectiveHost, transactions;

    const payload = {
      CreatedByUserId: user.id,
      FromCollectiveId: order.FromCollectiveId,
      ToCollectiveId: order.ToCollectiveId,
      transaction: {
        type: TransactionTypes.DONATION,
        OrderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        txnCurrency: order.currency,
        amountInTxnCurrency: order.totalAmount,
        txnCurrencyFxRate: 1,
        platformFeeInTxnCurrency: 0,
        paymentProcessorFeeInTxnCurrency: 0,
      }
    }
    return collective
      .getHostId()
      .then(HostId => HostId === order.FromCollectiveId)
      .tap(isHost => isFromCollectiveHost = isHost)
      .then(isFromCollectiveHost => {
        payload.transaction.hostFeeInTxnCurrency = isFromCollectiveHost ? 0 : Math.trunc(collective.hostFeePercent/100 * order.totalAmount);
        return models.Transaction.createFromPayload(payload);
      })
      .then(t => transactions = t)
      .then(() => !isFromCollectiveHost ? collective.findOrAddUserWithRole(user, roles.BACKER, { CreatedByUserId: user.id, TierId: order.TierId }) : Promise.resolve())
      .then(() => order.update({ processedAt: new Date }))
      .then(() => transactions); // make sure we return the transactions created
  }
}