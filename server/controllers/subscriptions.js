import Stripe from 'stripe';
import async from 'async';

import activities from '../constants/activities';

/**
 * Controller.
 */

export default function(app) {

  const models = app.set('models');
  const { errors } = app;

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
    const { subscriptionid } = req.params;

    async.auto({
      findSubscriptionsOptions: (cb) => {
        models.Transaction.find({
          include: [
            { model: models.Group },
            { model: models.PaymentMethod },
            { model: models.User },
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
                subscription: t.Subscription,
                group: t.Group,
                user: t.User
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
        const { subscription } = results.findSubscriptionsOptions;

        subscription.isActive = false;
        subscription.deactivatedAt = new Date();

        subscription.save()
          .then(() => cb())
          .catch(cb);
      }],

      createActivity: ['deactivateSubscription', (cb, results) => {
        const options = results.findSubscriptionsOptions;
        const { subscription } = options;
        const { group } = options;
        const { user } = options;
        models.Activity.create({
          type: activities.SUBSCRIPTION_CANCELED,
          GroupId: group.id,
          UserId: user.id,
          data: {
            subscriptionId: subscription.id,
            group: group.info,
            user: user.info
          }
        })
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
}
