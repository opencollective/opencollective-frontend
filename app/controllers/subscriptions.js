const Stripe = require('stripe');
const async = require('async');

/**
 * Controller.
 */

module.exports = function(app) {

  const email = require('../lib/email')(app);
  const models = app.set('models');
  const errors = app.errors;
  const Unauthorized = errors.Unauthorized;

  /**
   * Send an email with refreshed token
   */
  const refreshTokenByEmail = (req, res, next) => {
    if (!req.jwtPayload || !req.remoteUser) {
      return next(new Unauthorized('Invalid payload'));
    }

    const user = req.remoteUser;

    email.send('user.new.token', req.remoteUser.email, {
      subscriptionsLink: user.generateSubscriptionsLink(req.application)
    })
    .then(() => res.send({ success: true }))
    .catch(next);
  };

  /**
   * Send an email with the new token
   */
  const sendNewTokenByEmail = (req, res, next) => {
  if (!req.application || !req.required.email) {
    return next(new Unauthorized('Unauthorized'))
  }

    models.User.findOne({
      email: req.required.email
    })
    .then((user) => email.send('user.new.token', req.body.email, {
      subscriptionsLink: user.generateSubscriptionsLink(req.application)
    }))
    .then(()=>res.send({ success: true }))
    .catch(next);
  };

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
          include: [{ model: models.Group }]
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
            { model: models.Card },
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

          return new Promise((resolve, reject) => {
            t.Group.getStripeAccount((err, stripeAccount) => {
              return err ? reject(err) : resolve(stripeAccount);
            })
          })
          .then((stripeAccount) => {
            cb(null, {
              stripeSecret: stripeAccount.accessToken,
              customerId: t.Card.serviceId,
              subscriptionId: t.Subscription.stripeSubscriptionId,
              subscription: t.Subscription
            })
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
          .done(cb);
      }],
    }, (err) => {
      if (err) return next(err);

      res.send({ success: true });
    });

  };

  return {
    getAll,
    refreshTokenByEmail,
    sendNewTokenByEmail,
    cancel
  };
};
