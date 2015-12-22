/**
 * Dependencies.
 */

var async = require('async');

/**
 * Controller.
 */

module.exports = function(app) {

  /**
   * Internal Dependencies.
   */

  var errors = app.errors;

  var models = app.set('models');
  var Card = models.Card;
  var User = models.User;
  var Transaction = models.Transaction;
  var Group = models.Group;

  var transactions = require('./transactions')(app);

  var stripe = function(req, res, next) {
    var event = req.body;

    async.auto({
      fetchEvent: function(cb) {

        /**
         * We check the event on stripe to be sure we don't get a fake event from
         * someone else
         */
        app.stripe.events.retrieve(event.id, function(err, ev) {
          if (err) return next(err);

          if (ev.type !== 'invoice.payment_succeeded') {
            return next(new errors.BadRequest('Wrong event type received'));
          }

          cb(err, ev);
        });
      },

      fetchTransaction: ['fetchEvent', function(cb, results) {
        var invoice = results.fetchEvent.data.object;
        var subscription = invoice.lines.data[0];

        Transaction.findOne({
          where: {
            stripeSubscriptionId: subscription.id
          },
          include: [
            { model: Group },
            { model: User },
            { model: Card }
          ]
        })
        .then(function(transaction) {
          return cb(null, {
            transaction: transaction,
            subscription: subscription
          });
        })
        .catch(cb)
      }],

      createTransaction: ['fetchTransaction', function(cb, results) {
        var transaction = results.fetchTransaction.transaction;
        var subscription = results.fetchTransaction.subscription;
        var user = transaction.User || {};
        var group = transaction.Group || {};
        var card = transaction.Card || {};

        var transaction = {
            type: 'payment',
            amount: subscription.amount / 100,
            currency: subscription.currency,
            paidby: user && user.id,
            description: 'Recurring subscription',
            tags: ['Donation'],
            approved: true,
            stripeSubscriptionId: subscription.id
          };

        transactions._create({
          transaction: transaction,
          group: group,
          user: user,
          card: card
        }, cb);
      }]

    }, function(err, results) {
      if (err) return next(err);

      /**
       * We need to return a 200 to tell stripe to not retry the webhook.
       */
      res.sendStatus(200);
    });

  };

  return {
    stripe: stripe
  };

};
