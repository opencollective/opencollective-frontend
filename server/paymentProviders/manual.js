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
        type: TransactionTypes.CREDIT,
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
      .getHostCollectiveId()
      .tap(HostCollectiveId => {
        if (HostCollectiveId !== user.CollectiveId) {
          throw new Error("Cannot manually add funds to a collective that you are not hosting");
        }
      })
      .then(HostCollectiveId => HostCollectiveId === order.FromCollectiveId)
      .tap(isHost => isFromCollectiveHost = isHost)
      .then(isFromCollectiveHost => {
        payload.transaction.hostFeeInHostCurrency = isFromCollectiveHost ? 0 : Math.trunc(collective.hostFeePercent/100 * order.totalAmount);
        return models.Transaction.createFromPayload(payload);
      })
      .then(t => transaction = t)
      .then(() => !isFromCollectiveHost ? collective.findOrAddUserWithRole(user, roles.BACKER, { CreatedByUserId: user.id, TierId: order.TierId }) : Promise.resolve())
      .then(() => order.update({ processedAt: new Date }))
      .then(() => transaction); // make sure we return the transaction created
  }
}