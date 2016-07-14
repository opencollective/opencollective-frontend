const Stripe = require('stripe');
const async = require('async');

/**
 * Controller.
 */

module.exports = function(app) {

  const models = app.set('models');
  const errors = app.errors;

  /**
   * Get subscriptions of a user
   */
  const getAll = (req, res, next) => {
    models.Subscription.findAll({
      include: [
        {
          model: models.Transaction,
          where: {
            UserId: req.remoteUser.id
          },
          include: [{ model: models.Group },
                    { model: models.User }]
        },
      ]
    })
    .then((subscriptions) => res.send(subscriptions))
    .catch(next)
  };

  /**
   * Cancel a subscription
   */
  const cancel = (req, res, next) => {
    const subscriptionid = req.params.subscriptionid;

    async.auto({
      findSubscriptionsOptions: (cb) => {
        models.Transaction.find({
          include: [
            { model: models.Group },
            { model: models.PaymentMethod },
            {
              model: models.Subscription,
              where: {
                id: subscriptionid
              }
            },
            ]
        })
        .then(t => {

          if (!t || !t.Subscription) {
            return cb(new errors.BadRequest(`No subscription found with id ${subscriptionid}`));
          }

          return t.Group.getStripeAccount()
            .then((stripeAccount) => {
              cb(null, {
                stripeSecret: stripeAccount.accessToken,
                customerId: t.PaymentMethod.customerId,
                subscriptionId: t.Subscription.stripeSubscriptionId,
                subscription: t.Subscription
              });
            });
        })
        .catch(cb);
      },

      cancelOnStripe: ['findSubscriptionsOptions', (cb, results) => {
        const options = results.findSubscriptionsOptions;
        const stripe = Stripe(options.stripeSecret);

        stripe.customers.cancelSubscription(
          options.customerId,
          options.subscriptionId,
          cb
        );
      }],

      deactivateSubscription: ['cancelOnStripe', (cb, results) => {
        const subscription = results.findSubscriptionsOptions.subscription;

        subscription.isActive = false;
        subscription.deactivatedAt = new Date();

        subscription.save()
          .then(() => cb())
          .catch(cb);
      }],
    }, (err) => {
      if (err) return next(err);

      res.send({ success: true });
    });

  };

  return {
    getAll,
    cancel
  };
};
