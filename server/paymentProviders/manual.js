import models from '../models';
import { type as TransactionTypes } from '../constants/transactions';
import roles from '../constants/roles';

export default {
  features: {
    recurring: false
  },
  processOrder: (order) => {
    const collective = order.collective;
    const user = order.createdByUser;

    let isFromCollectiveHost, transaction;

    const payload = {
      CreatedByUserId: user.id,
      FromCollectiveId: order.FromCollectiveId,
      CollectiveId: order.CollectiveId,
      transaction: {
        type: TransactionTypes.DONATION,
        OrderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        hostCurrency: order.currency,
        amountInHostCurrency: order.totalAmount,
        hostCurrencyFxRate: 1,
        platformFeeInHostCurrency: 0,
        paymentProcessorFeeInHostCurrency: 0,
      }
    }
    return collective
      .getHostId()
      .then(HostId => HostId === order.FromCollectiveId)
      .tap(isHost => isFromCollectiveHost = isHost)
      .then(isFromCollectiveHost => {
        payload.transaction.hostFeeInHostCurrency = isFromCollectiveHost ? 0 : Math.trunc(collective.hostFeePercent/100 * order.totalAmount);
        console.log(">>> Transaction.createFromPayload ", payload);
        return models.Transaction.createFromPayload(payload);
      })
      .then(t => transaction = t)
      .then(() => !isFromCollectiveHost ? collective.findOrAddUserWithRole(user, roles.BACKER, { CreatedByUserId: user.id, TierId: order.TierId }) : Promise.resolve())
      .then(() => order.update({ processedAt: new Date }))
      .then(() => transaction); // make sure we return the transaction created
  }
}