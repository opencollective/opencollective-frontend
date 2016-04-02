/**
 * Dependencies.
 */
const roles = require('../constants/roles');
const _ = require('lodash');
const config = require('config');
const async = require('async');
const gateways = require('../gateways');

/**
 * Controller.
 */
module.exports = (app) => {

  /**
   * Internal Dependencies.
   */
  const models = app.set('models');
  const errors = app.errors;
  const transactions = require('../controllers/transactions')(app);
  const users = require('../controllers/users')(app);
  const emailLib = require('../lib/email')(app);
  const constants = require('../constants/transactions');


  const getOrCreateUser = (attributes, cb) => {
     return models.User.findOne({
        where: {
          email: attributes.email
        }
      })
      .then((user) => {
        if (user) {
          return cb(null, user);
        }

        users._create(attributes, cb);
      })
      .catch(cb);
  };

  const stripeDonation = (req, res, next) => {
    const payment = req.required.payment;
    const user = req.user;
    const email = payment.email;
    const group = req.group;
    const interval = payment.interval;
    const amountFloat = payment.amount; // TODO: clean this up when we switch all amounts to INTEGER
    const amountInt = parseInt(payment.amount * 100, 10) // TODO: clean this up when we switch all amounts to INTEGER
    const currency = payment.currency || group.currency;
    const isSubscription = _.contains(['month', 'year'], interval);
    var hasFullAccount = false; // Used to specify if a user has a real account

    if (interval && !isSubscription) {
      return next(new errors.BadRequest('Interval should be month or year.'));
    }

    if (!payment.stripeToken) {
      return next(new errors.BadRequest('Stripe Token missing.'));
    }

    if (!amountFloat) {
      return next(new errors.BadRequest('Payment Amount missing.'));
    }

    async.auto({

      getGroupStripeAccount(cb) {
        req.group.getStripeAccount()
          .then((stripeAccount) => {
            if (!stripeAccount || !stripeAccount.accessToken) {
              return cb(new errors.BadRequest(`The host for the collective id ${req.group.id} has no Stripe account set up`));
            }

            if (process.env.NODE_ENV !== 'production' && _.contains(stripeAccount.accessToken, 'live')) {
              return cb(new errors.BadRequest(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
            }

            cb(null, stripeAccount);
          })
          .catch(cb);
      },

      getOrCreatePaymentMethod: ['getGroupStripeAccount', (cb) => {
        models.PaymentMethod.getOrCreate({
          token: payment.stripeToken,
          service: 'stripe',
          UserId: user.id
        })
        .then((paymentMethod) => {
          return cb(null, paymentMethod);
        })
      }],

      createCustomer: ['getOrCreatePaymentMethod', (cb, results) => {
        const paymentMethod = results.getOrCreatePaymentMethod;

        if (paymentMethod.customerId) {
          return cb(null, results.getOrCreatePaymentMethod);
        }

        // Otherwise, create a customer on Stripe and add to paymentMethod
        gateways.stripe.createCustomer(
          results.getGroupStripeAccount,
          payment.stripeToken, {
            email,
            group
          })
          .tap((customer) => paymentMethod.update({customerId: customer.id}))
          .then((customer) => cb(null, customer))
          .catch(cb);
      }],

      /**
       * For one-time donation
       */

      createCharge: ['createCustomer', (cb, results) => {
        const paymentMethod = results.getOrCreatePaymentMethod;

        /**
         * Subscription
         */
        if (isSubscription) {
          const plan = {
            interval,
            amount: amountInt,
            currency
          };

          gateways.stripe.getOrCreatePlan(results.getGroupStripeAccount, plan)
            .then(plan => {
              const subscription = {
                plan: plan.id,
                application_fee_percent: constants.OC_FEE_PERCENT,
                metadata: {
                  groupId: group.id,
                  groupName: group.name,
                  paymentMethodId: paymentMethod.id
                }
              };

              return gateways.stripe.createSubscription(
                results.getGroupStripeAccount,
                paymentMethod.customerId,
                subscription
              );
            })
            .then(subscription => cb(null, subscription))
            .catch(cb);

        } else {

          /**
           * For one-time donation
           */
          const charge = {
            amount: amountInt,
            currency,
            customer: paymentMethod.customerId,
            description: `One time donation to ${group.name}`,
            application_fee: parseInt(amountInt*constants.OC_FEE_PERCENT/100, 10),
            metadata: {
              groupId: group.id,
              groupName: group.name,
              customerEmail: email,
              paymentMethodId: paymentMethod.id
            }
          };

          gateways.stripe.createCharge(results.getGroupStripeAccount, charge)
            .then(charge => cb(null, charge))
            .catch(cb);
        }
      }],

      // Create donation first
      createDonation: ['createCharge', (cb, results) => {
        const charge = results.createCharge;

        const donation = {
          UserId: user.id,
          GroupId: group.id,
          currency: currency,
          amount: amountInt,
          title: `Donation to ${group.name}`,
        };

        models.Donation.create(donation)
        .then(donation => {
          if (isSubscription) {
              const subscription = {
              amount: amountFloat,
              currency,
              interval,
              stripeSubscriptionId: charge.id,
              data: charge
            };
            return donation.createSubscription(subscription)
              .then(() => cb(null, donation));
          } else {
            return cb(null, donation);
          }
        })
        .catch(cb);
      }],

      retrieveBalanceTransaction: ['createCharge', (cb, results) => {
        if (isSubscription) {
          return cb();
        } else {
          const charge = results.createCharge;
          gateways.stripe.retrieveBalanceTransaction(results.getGroupStripeAccount, charge.balance_transaction)
          .then(balanceTransaction => cb(null, balanceTransaction))
          .catch(cb);
        }
      }],

      // Create the first transaction associated with that Donation, if this is not a subscription
      createTransaction: ['createDonation', 'retrieveBalanceTransaction', (cb, results) => {

        // If this is a subscription, wait for webhook to create a Transaction
        if (isSubscription) {
          return cb();
        }

        // Create a transaction for this one-time payment
        const user = req.user;
        const charge = results.createCharge;
        const paymentMethod = results.getOrCreatePaymentMethod;
        const balanceTransaction = results.retrieveBalanceTransaction
        const fees = gateways.stripe.extractFees(balanceTransaction);
        var payload = {
          user,
          group,
          paymentMethod
        };

        payload.transaction = {
          type: constants.type.DONATION,
          DonationId: results.createDonation.id,
          amount: amountFloat,
          currency,
          fxCurrency: balanceTransaction.currency,
          fxAmount: balanceTransaction.amount,
          fxRate: amountInt/balanceTransaction.amount,
          fxHostFee: parseInt(balanceTransaction.amount*0.05, 10), // TODO: find a better way than hardcoding
          fxPlatformFee: fees.applicationFee,
          fxPaymentProcessorFee: fees.stripeFee,
          data: {charge, balanceTransaction},

          paidby: user && user.id, // remove #postmigration
          description: `Donation to ${group.name}`, // remove #postmigration
          tags: ['Donation'], // remove #postmigration
          approved: true, // remove #postmigration
          interval // remove #postmigration
        };

        transactions._create(payload, cb);
      }],

      sendThankYouEmail: ['createDonation', (cb, results) => {
        const user = req.user;
        const donation = results.createDonation;
        const data = {
          donation: donation.info,
          user: user.info,
          group: group.info,
          subscriptionsLink: user.generateSubscriptionsLink(req.application)
        }

        var template = 'thankyou';
        if(group.name.match(/WWCode/i))
          template += '.wwcode';
        if(group.name.match(/ispcwa/i))
          template += '.ispcwa';

        emailLib.send(template, user.email, data);
        cb();
      }],

      addUserToGroup: ['createDonation', (cb) => {
        const user = req.user;
        models.UserGroup.findOne({
          where: {
            GroupId: group.id,
            UserId: user.id,
            role: roles.BACKER
          }
        })
        .then((userGroup) => {
          if (!userGroup)
            group
              .addUserWithRole(user, roles.BACKER)
              .done(cb);
          else {
            return cb();
          }
        })
        .catch(cb);
      }]

    }, (e) => {

      if (e) {
        e.payload = req.body;
        return next(e);
      }

      res.send({success: true, user: user.info, hasFullAccount: hasFullAccount});
    });

  };

  const paypalDonation = (req, res, next) => {
    const group = req.group;
    const payment = req.required.payment;
    const currency = payment.currency || group.currency;
    const amount = payment.amount;
    const interval = payment.interval;
    const isSubscription = _.contains(['month', 'year'], interval);

    if (interval && !isSubscription) {
      return next(new errors.BadRequest('Interval should be month or year.'));
    }

    if (!payment.amount) {
      return next(new errors.BadRequest('Payment Amount missing.'));
    }

    async.auto({

      getConnectedAccount: (cb) => {
        group.getConnectedAccount()
          .then((connectedAccount) => cb(null, connectedAccount))
          .catch(cb);
      },

      // We create the transaction beforehand to have the id in the return url when
      // the user logs on the PayPal website
      createTransaction: ['getConnectedAccount', (cb) => {
        const payload = {
          group,
          transaction: {
            type: 'payment',
            amount,
            currency,
            description: `Donation to ${group.name}`,
            tags: ['Donation'],
            approved: true,
            // In paranoid mode, the deleted transactions are not visible
            // We will create that temporary transaction that will only be visible once
            // the user executes the paypal token
            deletedAt: new Date()
          }
        };

       if (isSubscription) {
          payload.transaction.interval = interval;
          payload.subscription = {
            amount,
            currency,
            interval
          };
        }

        transactions._create(payload, cb);
      }],

      callPaypal: ['createTransaction', (cb, results) => {
        const connectedAccount = results.getConnectedAccount;
        const transaction = results.createTransaction;

        if (isSubscription) {
          gateways.paypal.createSubscription(
            connectedAccount,
            group,
            transaction
          , cb);
        } else {
          gateways.paypal.createPayment(
            connectedAccount,
            group,
            transaction
          , cb);
        }
      }],

      updateSubscription: ['callPaypal', (cb, results) => {
        if (!isSubscription) return cb();

        const transaction = results.createTransaction;

        transaction.getSubscription()
          .then((subscription) => {
            subscription.data = results.callPaypal.billingAgreement;

            return subscription.save();
          })
          .then(() => cb())
          .catch(cb);
      }]

    }, (e, results) => {
      if (e) {
        e.payload = req.body;
        return next(e);
      }

      const links = isSubscription
        ? results.callPaypal.billingAgreement.links
        : results.callPaypal.links

      res.send({
        success: true,
        links
      });
    });

  };

  const paypalCallback = (req, res, next) => {
    const transaction = req.paranoidtransaction;
    const group = req.group;
    const token = req.query.token;

    // For single payments
    const paymentId = req.query.paymentId;
    const PayerID = req.query.PayerID;

    const isSubscription = !paymentId || !PayerID;

    if (!token) {
      return next(new errors.BadRequest('Token to execute agreement is missing'));
    }

    async.auto({
      getConnectedAccount: (cb) => {
        req.group.getConnectedAccount()
          .then(connectedAccount => cb(null, connectedAccount))
          .catch(cb);
      },

      execute: ['getConnectedAccount', (cb, results) => {
        gateways.paypal.execute(
          results.getConnectedAccount,
          req.query.token,
          req.query.paymentId,
          req.query.PayerID
        , cb)
      }],

      activateSubscription: ['execute', (cb, results) => {
        if (!isSubscription) return cb();

        transaction.getSubscription()
          .then(subscription => {
            const billingAgreementId = results.execute.id;
            subscription.data = _.extend({}, subscription.data, { billingAgreementId });

            return subscription.save();
          })
          .then(() => cb())
          .catch(cb);
      }],

      getOrCreateUser: ['activateSubscription', (cb, results) => {
        const email = results.execute.payer.payer_info.email;

        getOrCreateUser({ email }, cb);
      }],

      addUserToGroup: ['getOrCreateUser', (cb, results) => {
        const user = results.getOrCreateUser;

        models.UserGroup.findOne({
          where: {
            GroupId: group.id,
            UserId: user.id,
            role: roles.BACKER
          }
        })
        .then((userGroup) => {
          if (!userGroup)
            group
              .addUserWithRole(user, roles.BACKER)
              .done(cb);
          else {
            return cb();
          }
        })
        .catch(cb);
      }],

      updateTransaction: ['addUserToGroup', (cb, results) => {
        transaction.restore() // removes the deletedAt field http://docs.sequelizejs.com/en/latest/api/instance/#restoreoptions-promiseundefined
          .then(() => transaction.setUser(results.getOrCreateUser))
          .then(() => cb())
          .catch(cb);
      }]
    }, (err, results) => {
      if (err) return next(err);
      const user = results.getOrCreateUser;

      res.redirect(`${config.host.website}/${req.group.slug}?status=payment_success&userid=${user.id}&has_full_account=${user.info.hasFullAccount}`);
    });

  };

  /**
   * Public methods.
   */
  return {
    post: stripeDonation, // leaving for legacy. Delete after frontend updates
    stripe: stripeDonation,
    paypal: paypalDonation,
    paypalCallback
  }
};
