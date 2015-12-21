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

    if (event.type !== 'invoice.payment_succeeded') {
      return next(new errors.BadRequest('Wrong event received'));
    }

    var invoice = event.data.object;
    var subscription = invoice.lines.data[0];

    async.auto({
      fetchEvent: function(cb) {
        app.stripe.events.retrieve(event.id, cb);
      },

      fetchTransaction: ['fetchEvent', function(cb, results) {
        Transaction.findOne({
          where: {
            stripeSubscriptionId: subscription.id
          },
          include: [
            { model: Group },
            { model: User },
            { model: Card }
          ]
        }, cb);
      }],

      createTransaction: ['fetchTransaction', function(cb, results) {
        var user = results.fetchTransaction.User;
        var group = results.fetchTransaction.Group;
        var card = results.fetchTransaction.Card;

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
          card: cCard
        }, cb);
      }]

    }, function(err, results) {
      if (err) return next(err);

      /**
       * We need to return a 200 to tell stripe to not retry the webhook.
       */
      res.send(200);
    });

  };

  return {
    stripe: stripe
  };

};
