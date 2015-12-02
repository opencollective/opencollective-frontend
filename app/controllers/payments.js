/**
 * Dependencies.
 */
var utils = require('../lib/utils');
var _ = require('lodash');
var async = require('async');
var Stripe = require('stripe');

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

  /**
   * Public methods.
   */
  return {

    /**
     * Post a payment.
     */
    post: function(req, res, next) {
      var payment = req.required.payment;
      var user = req.remoteUser;
      var group = req.group;

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

          if (results.getExistingCard)
            return cb(null, results.getExistingCard);

          stripe.customers
            .create({
              source: payment.stripeToken,
              description: 'payinguser@example.com',
              email: user && user.email
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

        createCharge: ['getGroupStripeAccount', 'createCard', function(cb, results) {
          var stripe = results.getGroupStripeAccount;
          var card = results.createCard;

          stripe.charges
            .create({
              amount: payment.amount * 100,
              currency: payment.currency || 'USD',
              customer: card.serviceId
            }, cb);
        }],

        createTransaction: ['createCard', 'createCharge', function(cb, results) {
          var charge = results.createCharge;

          var transaction = {
            type: 'payment',
            amount: payment.amount,
            currency: charge.currency,
            paidby: user && user.id,
            approved: true
          };

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
