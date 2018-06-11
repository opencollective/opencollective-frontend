import Promise from 'bluebird';

import models from '../../models';
import roles from '../../constants/roles';
import * as paymentsLib from '../../lib/payments';
import * as constants from '../../constants/transactions';

export default {
  features: {
    recurring: false,
    waitToCharge: false
  },

  getBalance: (paymentMethod) => {
    return Promise.resolve({ amount: paymentMethod.monthlyLimitPerMember, currency: paymentMethod.currency});
  },

  processOrder: (order) => {
    /*
      - use gift card PaymentMethod (PM) to transfer money from gift card issuer to User
      - mark original gift card PM as "archivedAt" (it's used up)
      - create new PM type "opencollective" and attach to User (User now has credit in the system)
      - Use new PM to give money from User to Collective
    */

    const user = order.createdByUser;
    const originalPM = order.paymentMethod;

    let newPM, transactions;

    // Check that target Collective's Host is same as gift card issuer
    return order.collective.getHostCollective()
      .then(hostCollective => {
        if (hostCollective.id !== order.paymentMethod.CollectiveId) {
          console.log('Different host found');
          return Promise.resolve();
        } else {
          // transfer all money using gift card from Host to User
          const payload = {
            CreatedByUserId: user.id,
            FromCollectiveId: order.paymentMethod.CollectiveId,
            CollectiveId: user.CollectiveId,
            PaymentMethodId: order.PaymentMethodId,
            transaction: {
              type: constants.TransactionTypes.CREDIT,
              OrderId: order.id,
              amount: order.paymentMethod.monthlyLimitPerMember, // treating this field as one-time limit
              amountInHostCurrency: order.paymentMethod.monthlyLimitPerMember,
              currency: order.paymentMethod.currency,
              hostCurrency: order.currency, // assuming all USD transactions for now
              hostCurrencyFxRate: 1,
              hostFeeInHostCurrency: 0,
              platformFeeInHostCurrency: 0, // we don't charge a fee until the money is used by User
              paymentProcessorFeeInHostCurrency: 0,
              description: order.paymentMethod.name,
              HostCollectiveId: order.paymentMethod.CollectiveId // hacky, HostCollectiveId doesn't quite make sense in this context but required by ledger. TODO: fix later.
            }
          };
          return models.Transaction.createFromPayload(payload)

          // mark gift card as used, so no one can use it again
          .then(() => order.paymentMethod.update({archivedAt: new Date()}))


          // create new payment method to allow User to use the money
          .then(() => models.PaymentMethod.create({
            name: originalPM.name,
            service: 'opencollective',
            type: 'collective', // changes to type collective
            confirmedAt: new Date(),
            CollectiveId: user.CollectiveId,
            CreatedByUserId: user.id,
            MonthlyLimitPerMember: originalPM.monthlyLimitPerMember,
            currency: originalPM.currency,
            token: null // we don't pass the gift card token on
          }))

          // Use the above payment method to donate to Collective
          .then(pm => newPM = pm)
          .then(() => {

            const hostFeeInHostCurrency = paymentsLib.calcFee(
              order.totalAmount,
              order.collective.hostFeePercent);
            const platformFeeInHostCurrency = paymentsLib.calcFee(
              order.totalAmount, constants.OC_FEE_PERCENT);
            const payload = {
              CreatedByUserId: user.id,
              FromCollectiveId: order.FromCollectiveId,
              CollectiveId: order.CollectiveId,
              PaymentMethodId: newPM.id,
              transaction: {
                type: constants.TransactionTypes.CREDIT,
                OrderId: order.id,
                amount: order.totalAmount,
                amountInHostCurrency: order.totalAmount,
                currency: order.currency,
                hostCurrency: order.currency,
                hostCurrencyFxRate: 1,
                hostFeeInHostCurrency,
                platformFeeInHostCurrency,
                paymentProcessorFeeInHostCurrency: 0,
                description: order.description
              }
            };

            return models.Transaction.createFromPayload(payload)
              .then(t => transactions = t)

              // add roles
              .then(() => order.collective.findOrAddUserWithRole({ id: user.id, CollectiveId: order.fromCollective.id}, roles.BACKER, {
                CreatedByUserId: user.id, TierId: order.TierId }))

              // Mark order row as processed
              .then(() => order.update({ processedAt: new Date() }))

              // Mark paymentMethod as confirmed
              .then(() => newPM.update({ confirmedAt: new Date() }))

              .then(() => transactions); // make sure we return the transactions created
          });
        }
      });
  }
};
