/**
 * Dependencies.
 */

var async = require('async');
var _ = require('lodash');

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
          const subscription = _.find(invoiceLineItems, { type: 'subscription' });

          cb(null, { event, subscription });
        })
        .catch(cb);
      },

      createActivity: ['fetchEvent', (cb, results) => {
        // Only save activity when the event is valid
        Activity.create({
          type: 'webhook.stripe.received',
          data: {
            event: results.fetchEvent.event
          }
        })
        .done(cb);
      }],

      fetchPendingTransaction: ['createActivity', (cb, results) => {
        Transaction.findOne({
          where: {
            stripeSubscriptionId: results.fetchEvent.subscription.id,
            isWaitingFirstInvoice: true
          }
        })
        .done(cb);
      }],

      fetchTransaction: ['createActivity', (cb, results) => {
        Transaction.findOne({
          where: {
            stripeSubscriptionId: results.fetchEvent.subscription.id
          },
          include: [
            { model: Group },
            { model: User },
            { model: Card }
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

      createOrUpdateTransaction: ['fetchTransaction', 'fetchPendingTransaction', (cb, results) => {
        const pendingTransaction = results.fetchPendingTransaction;

        // If the transaction is pending, we will just update it
        // We only use pending transactions for the first subscription invoice
        if (pendingTransaction && pendingTransaction.isWaitingFirstInvoice) {
          pendingTransaction.isWaitingFirstInvoice = false;

          return pendingTransaction.save()
            .done(cb);
        }

        const transaction = results.fetchTransaction;
        const subscription = results.fetchEvent.subscription;
        const user = transaction.User || {};
        const group = transaction.Group || {};
        const card = transaction.Card || {};

        const newTransaction = {
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
