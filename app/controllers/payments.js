/**
 * Dependencies.
 */
const utils = require('../lib/utils');
const roles = require('../constants/roles');
const _ = require('lodash');
const config = require('config');
const async = require('async');
const Stripe = require('stripe');
const paypal = require('paypal-rest-sdk');

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
  var emailLib = require('../lib/email')(app);

  const getOrCreatePlan = (params, cb) => {
    var stripe = params.stripe;
    var plan = params.plan;

    stripe.plans.retrieve(plan.id, (err, result) => {
      var type = err && err.type;
      var message = err && err.message;

      if (type === 'StripeInvalidRequest' && _.contains(message, 'No such plan')) {
        stripe.plans.create(plan, cb);
      } else {
        cb(err, result);
      }
    });
  };

  const post = (req, res, next) => {
    var payment = req.required.payment;
    var user = req.remoteUser;
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

      getGroupStripeAccount: function(cb) {
        req.group.getStripeAccount(function(err, stripeAccount) {
          if (err) return cb(err);
          if (!stripeAccount || !stripeAccount.accessToken) {
            return cb(new errors.BadRequest('The host for the collective id ' + req.group.id + ' has no Stripe account set up'));
          }

          if (process.env.NODE_ENV !== 'production' && _.contains(stripeAccount.accessToken, 'live')) {
            return cb(new errors.BadRequest(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
          }

          cb(null, Stripe(stripeAccount.accessToken));
        });
      },

      getExistingCard: ['getGroupStripeAccount', function(cb) {
        models.Card
          .findOne({
            where: {
              token: payment.stripeToken,
              service: 'stripe'
            }
          })
          .then(function(card) {
            cb(null, card);
          })
          .catch(cb);
      }],

      createCustomer: ['getGroupStripeAccount', 'getExistingCard', function(cb, results) {
        var stripe = results.getGroupStripeAccount;

        if (results.getExistingCard) {
          return cb(null, results.getExistingCard);
        }

        stripe.customers
          .create({
            source: payment.stripeToken,
            description:  'Paying ' + email + ' to ' + group.name,
            email: email
          }, cb);
      }],

      createCard: ['createCustomer', 'getExistingCard', function(cb, results) {
        if (results.getExistingCard) {
          return cb(null, results.getExistingCard);
        }

        models.Card
          .create({
            token: payment.stripeToken,
            serviceId: results.createCustomer.id,
            service: 'stripe',
            UserId: user && user.id,
            GroupId: group.id
          })
          .done(cb);
      }],

      /**
       * For one-time donation
       */

      createCharge: ['getGroupStripeAccount', 'createCard', function(cb, results) {
        var stripe = results.getGroupStripeAccount;
        var card = results.createCard;
        var amount = payment.amount * 100;
        var currency = payment.currency || group.currency;

        /**
         * Subscription
         */
        if (isSubscription) {

          var id = utils.planId({
            currency,
            interval,
            amount
          });

          getOrCreatePlan({
            plan: {
              id,
              interval,
              amount,
              name: id,
              currency
            },
            stripe
          }, (err, plan) => {
            if (err) return cb(err);

            stripe.customers
              .createSubscription(card.serviceId, {
                plan: plan.id,
                application_fee_percent: OC_FEE_PERCENT,
                metadata: {
                  groupId: group.id,
                  groupName: group.name,
                  cardId: card.id
                }
              }, cb);
          });

        } else {

          /**
           * For one-time donation
           */
          stripe.charges
            .create({
              amount: amount,
              currency: currency,
              customer: card.serviceId,
              description: 'One time donation to ' + group.name,
              metadata: {
                groupId: group.id,
                groupName: group.name,
                customerEmail: email,
                cardId: card.id
              }
            }, cb);
        }
      }],

      /*
       *  Creates a user in our system to associate with this transaction
       */
      getOrCreateUser: ['createCharge', function(cb) {
        return models.User.findOne({
          where: {
            email: email
          }
        })
        .then(function(user) {
          if (user) {
            hasFullAccount = (user.password_hash ? true : false);
            cb(null, user);
          } else {
            users._create({
              email: email
            }, cb);
          }
        })
        .catch(cb);
      }],

      createTransaction: ['getOrCreateUser', 'createCard', 'createCharge', function(cb, results) {
        const charge = results.createCharge;
        const user = results.getOrCreateUser;
        const card = results.createCard;
        const currency = charge.currency || charge.plan.currency;
        const amount = payment.amount;

        var payload = {
          user,
          group,
          card
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
        const user = results.getOrCreateUser;
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

      addUserToGroup: ['createTransaction', function(cb, results) {
        user = results.getOrCreateUser;

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

    async.auto({

      getPaypalConfig: (cb) => {
        group.getConnectedAccount()
          .then((connectedAccount) => {

            // We will pass the config in all the subsequent calls to be sure we don't
            // overwrite the configuration of the global sdk
            // Example: https://github.com/paypal/PayPal-node-SDK/blob/master/samples/configuration/multiple_config.js
            cb(null, {
              mode: config.paypal.rest.mode,
              client_id: connectedAccount.clientId,
              client_secret: connectedAccount.secret
            });
          })
          .catch(cb);
      },

      // We create the transaction beforehand to have the id in the return url when
      // the user logs on the PayPal website
      createTransaction: ['getPaypalConfig', (cb) => {
        const transaction = {
          type: 'payment',
          amount,
          currency,
          description: `Donation to ${group.name}`,
          tags: ['Donation'],
          approved: true,
          interval: 'month'
        };

        const subscription = {
          amount,
          currency,
          interval: 'month'
        };

        transactions._create({
          transaction,
          subscription,
          group
        }, cb);
      }],

      createPlan: ['createTransaction', (cb, results) => {
        const transactionId = results.createTransaction.id;
        const callbackUrl = `http://localhost:3060/groups/${group.id}/transactions/${transactionId}/callback`;
        const billingPlan = {
          description: `Plan for donation to ${group.name}`,
          name: `Plan ${group.name}`,
          merchant_preferences: {
            cancel_url: callbackUrl,
            return_url: callbackUrl
          },
          payment_definitions: [{
            amount: {
              currency,
              value: amount
            },
            cycles: '0',
            frequency: 'MONTH',
            frequency_interval: '1',
            name: `Regular payment`,
            type: 'REGULAR' // or TRIAL
          }],
          type: 'INFINITE' // or FIXED
        };

        paypal.billingPlan.create(billingPlan, results.getPaypalConfig, cb);
      }],

      activatePlan: ['createPlan', (cb, results) => {
        paypal.billingPlan.activate(results.createPlan.id, results.getPaypalConfig, cb);
      }],

      createBillingAgreement: ['activatePlan', (cb, results) => {
        // From paypal example, fails with moment js, TO REFACTOR
        var isoDate = new Date();
        isoDate.setSeconds(isoDate.getSeconds() + 4);
        isoDate.toISOString().slice(0, 19) + 'Z';

        const billingAgreement = {
          name: `Agreement for donation to ${group.name}`,
          description: `Agreement for donation to ${group.name}`,
          start_date: isoDate,
          plan: {
            id: results.createPlan.id
          },
          payer: {
            payment_method: 'paypal'
          }
        };

        paypal.billingAgreement.create(billingAgreement, results.getPaypalConfig, cb);
      }],

      updateSubscription: ['createBillingAgreement', (cb, results) => {
        const transaction = results.createTransaction;

        transaction.getSubscription()
          .then((subscription) => {
            subscription.data = results.createBillingAgreement;

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

      res.send({
        success: true,
        links: results.createBillingAgreement.links
      });
    });

  };

  const paypalCallback = (req, res, next) => {
    const transaction = req.transaction;
    const token = req.query.token;

    if (!token) {
      return next(new errors.BadRequest('Token to execute agreement is missing'));
    }

    async.auto({
      getPaypalConfig: (cb) => {
        req.group.getConnectedAccount()
          .then(connectedAccount => {
            return cb(null, {
              mode: config.paypal.rest.mode, //sandbox or live
              client_id: connectedAccount.clientId,
              client_secret: connectedAccount.secret
            });
          })
          .catch(cb);
      },

      executeBillingAgreement: ['getPaypalConfig', (cb, results) => {
        paypal.billingAgreement.execute(token, {}, results.getPaypalConfig, cb);
      }],

      activateSubscription: ['executeBillingAgreement', (cb, results) => {
        transaction.getSubscription()
          .then(subscription => {
            const data = _.extend({}, subscription.data, {
              billingAgreementId: results.executeBillingAgreement.id
            });

            // JSON with sequelize is a bag of fun :D https://github.com/sequelize/sequelize/issues/2862
            subscription.data = data;
            subscription.isActive = true;
            subscription.activatedAt = new Date();

            return subscription.save();
          })
          .then(() => cb())
          .catch(cb);
      }],
    }, (err) => {
      if (err) return next(err);

      res.redirect(`${config.host.website}/${req.group.slug}?status=payment_success`);
    });

  };

  /**
   * Public methods.
   */
  return {
    getOrCreatePlan, // Exposed for testing
    post,
    paypal: paypalDonation,
    paypalCallback
  }
};
