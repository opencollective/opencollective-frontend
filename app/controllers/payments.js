/**
 * Dependencies.
 */
var utils = require('../lib/utils');
var _ = require('lodash');
var async = require('async');
var Stripe = require('stripe');

var OC_FEE_PERCENT = 5;

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

  var getOrCreatePlan = function(params, cb) {
    var stripe = params.stripe;
    var plan = params.plan;

    stripe.plans.retrieve(plan.id, function(err, result) {
      var type = err && err.type;
      var message = err && err.message;

      if (type === 'StripeInvalidRequest' && _.contains(message, 'No such plan')) {
        stripe.plans.create(plan, cb);
      } else {
        cb(err, result);
      }
    });
  };

  /**
   * Public methods.
   */
  return {

    /**
     * Return a plan or creates a new one
     * Exposed for testing
     */
    getOrCreatePlan: getOrCreatePlan,

    /**
     * Post a payment.
     */
    post: function(req, res, next) {
      var payment = req.required.payment;
      var user = req.remoteUser;
      var group = req.group;
      var interval = payment.interval;
      var isSubscription = _.contains(['month', 'year'], interval);

      if (interval && !isSubscription) {
        return next(new errors.BadRequest('Interval should be month or year.'));
      }

      if (!payment.stripeToken) {
        return next(new errors.BadRequest('Stripe Token missing.'));
      }

      if (!payment.amount) {
        return next(new errors.BadRequest('Payment Amount missing.'));
      }

      // How to deal with recurrent charge?
      //   - By ourselves?
      //   - With Stripe subscription? https://stripe.com/docs/subscriptions
      //     In this case, we need to implement: 1. plans for each Managed Account, 2. Webhood to create transactions

      async.auto({

        getGroupStripeAccount: function(cb) {
          req.group.getStripeManagedAccount()
            .then(function(stripeAccount) {
              return cb(null, Stripe(stripeAccount.stripeSecret));
            })
            .catch(cb);
        },

        getExistingCard: ['getGroupStripeAccount', function(cb, results) {
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
          var email = user && user.email;

          if (results.getExistingCard)
            return cb(null, results.getExistingCard);

          stripe.customers
            .create({
              source: payment.stripeToken,
              description:  'Paying ' + email + ' to ' + group.name,
              email: email
            }, cb);
        }],

        createCard: ['createCustomer', 'getExistingCard', function(cb, results) {
          if (results.getExistingCard)
            return cb(null, results.getExistingCard);

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
          var currency = payment.currency || 'USD';

          /**
           * Subscription
           */
          if (isSubscription) {
            var id = utils.planId({
              currency: currency,
              interval: interval,
              amount: amount
            });

            getOrCreatePlan({
              plan: {
                id: id,
                interval: interval,
                amount: amount,
                name: id,
                currency: currency
              },
              stripe: stripe
            }, function(err, plan) {
              if (err) return cb(err);

              stripe.customers
                .createSubscription(card.serviceId, {
                  plan: plan.id,
                  application_fee_percent: OC_FEE_PERCENT
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
                customer: card.serviceId
              }, cb);
          }
        }],

        createTransaction: ['createCard', 'createCharge', function(cb, results) {
          var charge = results.createCharge;

          var description = ['Donation from', user && user.email, 'to', group && group.name].join(' ');
          var transaction = {
            type: 'payment',
            amount: payment.amount,
            currency: charge.currency,
            paidby: user && user.id,
            description: description,
            tags: ['Donation'],
            approved: true
          };

          if (isSubscription) {
            transaction.stripeSubscriptionId = charge.id;
          }

          ['description', 'beneficiary', 'paidby', 'tags', 'status', 'link', 'comment'].forEach(function(prop) {
            if (payment[prop])
              transaction[prop] = payment[prop];
          });

          transactions._create({
            transaction: transaction,
            user: user,
            group: group,
            card: results.createCard
          }, cb);
        }],

        addUserToGroup: ['createTransaction', function(cb, results) {
          if (!user)
            return cb();

          group
            .hasMember(user)
            .then(function(isMember) {
              if (isMember)
                return cb();
              else {
                group
                  .addMember(user, {role: 'viewer'})
                  .done(cb);
              }
            })
            .catch(cb);
        }]

      }, function(e, results) {
        if (e) return next(e);

        res.send({success: true});
      });

    }

  }

};
