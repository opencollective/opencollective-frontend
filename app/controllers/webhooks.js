/**
 * Dependencies.
 */

var async = require('async');
var _ = require('lodash');
var activities = require('../constants/activities');

/**
 * Controller.
 */

module.exports = (app) => {

  /**
   * Internal Dependencies.
   */

  const errors = app.errors;

  const models = app.set('models');
  const Card = models.Card;
  const User = models.User;
  const Transaction = models.Transaction;
  const Activity = models.Activity;
  const Subscription = models.Subscription;
  const Group = models.Group;

  const transactions = require('./transactions')(app);

  const stripe = (req, res, next) => {
    const body = req.body;
    const isProduction = app.set('env') === 'production';

    // Stripe send test events to production as well
    // don't do anything if the event is not livemode
    if (isProduction && !body.livemode) {
      return res.sendStatus(200);
    }

    async.auto({
      fetchEvent: (cb) => {

        /**
         * We check the event on stripe to be sure we don't get a fake event from
         * someone else
         */
        app.stripe.events.retrieve(body.id, {
          stripe_account: body.user_id
        })
        .then(event => {
          if (event.type !== 'invoice.payment_succeeded') {
            return cb(new errors.BadRequest('Wrong event type received'));
          }

          const invoice = event.data.object;
          const invoiceLineItems = invoice.lines.data;
          const stripeSubscription = _.find(invoiceLineItems, { type: 'subscription' });

          cb(null, {
            event,
            stripeSubscription
          });
        })
        .catch(cb);
      },

      createActivity: ['fetchEvent', (cb, results) => {
        // Only save activity when the event is valid
        Activity.create({
          type: activities.WEBHOOK_STRIPE_RECEIVED,
          data: {
            event: results.fetchEvent.event,
            stripeAccount: body.user_id,
            eventId: body.id,
            dashboardUrl: `https://dashboard.stripe.com/${body.user_id}/events/${body.id}`
          }
        })
        .done(cb);
      }],

      fetchTransaction: ['createActivity', (cb, results) => {
        const stripeSubscriptionId = results.fetchEvent.stripeSubscription.id;

        Transaction.findOne({
          include: [
            { model: Group },
            { model: User },
            { model: Card },
            { model: Subscription, where: { stripeSubscriptionId } }
          ]
        })
        .then((transaction) => {
          /**
           * Stripe doesn't make a difference between development, test, staging
           * environments. If we get a webhook from another env, `transaction.stripeSubscriptionId`
           * will not be found and throw an error. Stripe will retry to send the webhook
           * if it doesn't get a 2XX status code.
           * For non-production environments, we will simply return 200 to avoid
           * the retry on Stripe side (and the email from Stripe support).
           */
          if (!transaction && !isProduction) {
            return res.sendStatus(200);
          }

          if (!transaction) {
            return cb(new errors.BadRequest('Transaction not found: unknown subscription id'));
          }

          return cb(null, transaction);
        })
        .catch(cb)
      }],

      createOrUpdateTransaction: ['fetchTransaction', (cb, results) => {
        const transaction = results.fetchTransaction;
        const subscription = transaction.Subscription;
        const stripeSubscription = results.fetchEvent.stripeSubscription;
        const user = transaction.User || {};
        const group = transaction.Group || {};
        const card = transaction.Card || {};

        // If the subscription is not active, we will just update the already existing one
        // We only use pending subscriptions for the first subscription invoice
        if (!subscription.isActive) {
          subscription.isActive = true;
          subscription.activatedAt = new Date();

          return subscription.save()
            .then(subscription => {
              return Activity.create({
                type: activities.SUBSCRIPTION_CONFIRMED,
                data: {
                  event: results.fetchEvent.event,
                  group: results.fetchTransaction.Group,
                  user: results.fetchTransaction.User,
                  transaction: results.fetchTransaction,
                  subscription
                }
              });
            })
            .then(() => cb())
            .catch(cb);
        }


        const newTransaction = {
          type: 'payment',
          amount: stripeSubscription.amount / 100,
          currency: stripeSubscription.currency,
          paidby: user && user.id,
          description: 'Recurring subscription',
          tags: ['Donation'],
          approved: true,
          interval: transaction.interval,
          SubscriptionId: subscription.id
        };

        transactions._create({
          transaction: newTransaction,
          user,
          group,
          card
        }, cb);
      }]

    }, (err) => {
      if (err) return next(err);

      /**
       * We need to return a 200 to tell stripe to not retry the webhook.
       */
      res.sendStatus(200);
    });

  };

  return {
    stripe
  };

};
