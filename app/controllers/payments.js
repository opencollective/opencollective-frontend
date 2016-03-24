/**
 * Dependencies.
 */
const roles = require('../constants/roles');
const _ = require('lodash');
const config = require('config');
const async = require('async');
const gateways = require('../gateways');

const OC_FEE_PERCENT = 5;

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');
  var errors = app.errors;
  var transactions = require('../controllers/transactions')(app);
  var users = require('../controllers/users')(app);
  var emailLib = require('../lib/email')(app);



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

  const post = (req, res, next) => {
    var payment = req.required.payment;
    var user = req.user;
    var email = payment.email;
    var group = req.group;
    var interval = payment.interval;
    var isSubscription = _.contains(['month', 'year'], interval);
    var hasFullAccount = false; // Used to specify if a user has a real account

    if (interval && !isSubscription) {
      return next(new errors.BadRequest('Interval should be month or year.'));
    }

    if (!payment.stripeToken) {
      return next(new errors.BadRequest('Stripe Token missing.'));
    }

    if (!payment.amount) {
      return next(new errors.BadRequest('Payment Amount missing.'));
    }

    async.auto({

      getGroupStripeAccount(cb) {
        req.group.getStripeAccount()
          .then((stripeAccount) => {
            if (!stripeAccount || !stripeAccount.accessToken) {
              return cb(new errors.BadRequest('The host for the collective id ' + req.group.id + ' has no Stripe account set up'));
            }

            if (process.env.NODE_ENV !== 'production' && _.contains(stripeAccount.accessToken, 'live')) {
              return cb(new errors.BadRequest(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
            }

            cb(null, stripeAccount.accessToken);
          })
          .catch(cb);
      },

      getExistingPaymentMethod: ['getGroupStripeAccount', (cb) => {
        models.PaymentMethod.findOne({
          where: {
            token: payment.stripeToken,
            service: 'stripe'
          }
        })
        .then(p => cb(null, p))
        .catch(cb);
      }],

      createCustomer: ['getGroupStripeAccount', 'getExistingPaymentMethod', (cb, results) => {
        // Only create payment method for new customer
        if (results.getExistingPaymentMethod) {
          return cb(null, results.getExistingPaymentMethod);
        }

        gateways.stripe.createCustomer(
          results.getGroupStripeAccount,
          payment.stripeToken, {
            email,
            group
          })
          .then((customer) => cb(null, customer))
          .catch(cb);
      }],

      createPaymentMethod: ['createCustomer', 'getExistingPaymentMethod', function(cb, results) {
        if (results.getExistingPaymentMethod) {
          return cb(null, results.getExistingPaymentMethod);
        }

        models.PaymentMethod
          .create({
            token: payment.stripeToken,
            customerId: results.createCustomer.id,
            service: 'stripe',
            UserId: user && user.id,
            GroupId: group.id
          })
          .done(cb);
      }],

      /**
       * For one-time donation
       */

      createCharge: ['getGroupStripeAccount', 'createPaymentMethod', function(cb, results) {
        const paymentMethod = results.createPaymentMethod;
        const amount = payment.amount * 100;
        const currency = payment.currency || group.currency;

        /**
         * Subscription
         */
        if (isSubscription) {
          const plan = {
            interval,
            amount,
            currency
          };

          gateways.stripe.getOrCreatePlan(results.getGroupStripeAccount, plan)
            .then(plan => {
              const subscription = {
                plan: plan.id,
                application_fee_percent: OC_FEE_PERCENT,
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
            amount,
            currency,
            customer: paymentMethod.customerId,
            description: `One time donation to ${group.name}`,
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

      createTransaction: ['createPaymentMethod', 'createCharge', function(cb, results) {
        const user = req.user;
        const charge = results.createCharge;
        const paymentMethod = results.createPaymentMethod;
        const currency = charge.currency || charge.plan.currency;
        const amount = payment.amount;

        var payload = {
          user,
          group,
          paymentMethod
        };

        payload.transaction = {
          type: 'payment',
          amount,
          currency,
          paidby: user && user.id,
          description: `Donation to ${group.name}`,
          tags: ['Donation'],
          approved: true,
          interval
        };

        if (isSubscription) {
          payload.subscription = {
            amount,
            currency,
            interval,
            stripeSubscriptionId: charge.id,
            data: results.createCharge
          };
        }

        transactions._create(payload, cb);
      }],

      sendThankYouEmail: ['createTransaction', function(cb, results) {
        const user = req.user;
        const transaction = results.createTransaction;
        const data = {
          transaction: transaction.info,
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

      addUserToGroup: ['createTransaction', function(cb) {
        const user = req.user;
        models.UserGroup.findOne({
          where: {
            GroupId: group.id,
            UserId: user.id,
            role: roles.BACKER
          }
        })
        .then(function(userGroup) {
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

    }, function(e) {

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
    post,
    paypal: paypalDonation,
    paypalCallback
  }
};
