const gateways = require('../gateways');
const transactions = require('../constants/transactions');
const roles = require('../constants/roles');
const emailLib = require('./email');

export const processDonation = (Sequelize, donation) => {

  const services = {

    stripe: (donation) => {

      const group = donation.Group;
      const user = donation.User;
      const paymentMethod = donation.PaymentMethod;
      const subscription = donation.Subscription;

      const createSubscription = (groupStripeAccount) => {
        return gateways.stripe.getOrCreatePlan(
            groupStripeAccount,
            { interval: subscription.interval,
              amount: donation.amount, // needs to be in INT
              currency: donation.currency
            })
          .then(plan => gateways.stripe.createSubscription(
              groupStripeAccount,
              paymentMethod.customerId,
              { plan: plan.id,
                application_fee_percent: transactions.OC_FEE_PERCENT,
                metadata: {
                  groupId: group.id,
                  groupName: group.name,
                  paymentMethodId: paymentMethod.id,
                  description: `OpenCollective: ${group.slug}`
                }
              }))
          .then(stripeSubscription => subscription.update({stripeSubscriptionId: stripeSubscription.id}));
      };

      const createChargeAndTransaction = (groupStripeAccount) => {
        let charge;
        return gateways.stripe.createCharge(
            groupStripeAccount,
            { amount: donation.amount,
              currency: donation.currency,
              customer: paymentMethod.customerId,
              description: `OpenCollective: ${group.slug}`,
              application_fee: parseInt(donation.amount*transactions.OC_FEE_PERCENT/100, 10),
              metadata: {
                groupId: group.id,
                groupName: group.name,
                customerEmail: user.email,
                paymentMethodId: paymentMethod.id
              }
            })
          .tap(c => charge = c)
          .then(charge => gateways.stripe.retrieveBalanceTransaction(
              groupStripeAccount,
              charge.balance_transaction))
          .then(balanceTransaction => {
            // create a transaction
            const fees = gateways.stripe.extractFees(balanceTransaction);
            const hostFeePercent = group.hostFeePercent;
            const payload = {
              user,
              group,
              paymentMethod
            }
            payload.transaction = {
              type: transactions.type.DONATION,
              DonationId: donation.id,
              amount: donation.amount / 100, // in Float
              currency: donation.currency,
              txnCurrency: balanceTransaction.currency,
              amountInTxnCurrency: balanceTransaction.amount,
              txnCurrencyFxRate: donation.amount/balanceTransaction.amount,
              hostFeeInTxnCurrency: parseInt(balanceTransaction.amount*hostFeePercent/100, 10),
              platformFeeInTxnCurrency: fees.applicationFee,
              paymentProcessorFeeInTxnCurrency: fees.stripeFee,
              data: {charge, balanceTransaction},
            }
            return Sequelize.models.Transaction.createFromPayload(payload)
          })
      };

      let groupStripeAccount;

      return group.getStripeAccount()
        .then(stripeAccount => groupStripeAccount = stripeAccount)

        // get or create a customer
        .then(() => paymentMethod.customerId || gateways.stripe.createCustomer(
          groupStripeAccount,
          paymentMethod.token, {
            email: user.email,
            group
          }))

        .tap(customer => paymentMethod.customerId ? null : paymentMethod.update({customerId: customer.id}))

        .then(() => {
          if (subscription) {
            return createSubscription(groupStripeAccount, subscription, donation, paymentMethod, group);
          } else {
            return createChargeAndTransaction(groupStripeAccount, donation, paymentMethod, group, user);
          }
        })

        // add user to the group
        // TODO: this should happen in webhooks for subscriptions
        // because that's when the transaction is created. Future refactor
        .then(() => group.findOrAddUserWithRole(user, roles.BACKER))

        // Mark donation row as processed
        .then(() => donation.update({isProcessed: true, processedAt: new Date()}))

        // send out confirmation email
        .then(() => emailLib.send(
          'thankyou',
          user.email,
          { donation: donation.info,
            user,
            group,
            interval: subscription && subscription.interval
            // TODO: bring this back. Figure out how to pass the application link
            // subscriptionsLink: user.generateLoginLink(req.application, '/subscriptions')
          }));
      }
    }

  return Sequelize.models.Donation.findById(donation.id, {
    include: [{ model: Sequelize.models.User },
              { model: Sequelize.models.Group },
              { model: Sequelize.models.PaymentMethod },
              { model: Sequelize.models.Subscription }]
    })
    .then(donation => {
      if (!donation.PaymentMethod || donation.PaymentMethod.service === 'paypal') {
        // for manual add funds and paypal, which isn't processed this way yet
        return donation.update({isProcessed: true, processedAt: new Date()});
      } else {
        return services[donation.PaymentMethod.service](donation)
      }
    })
    .catch(err => {
      console.error(`Error while processing donation id: ${donation.id}`, err);
      return emailLib.sendMessage(
        'server-errors@opencollective.com',
        `Failed to process donation id: ${donation.id}`,
        `Error: ${err}\n\nDonation: ${donation.info}`
        )
    });
};
