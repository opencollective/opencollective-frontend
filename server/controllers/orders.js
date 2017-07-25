import models from '../models';
import errors from '../lib/errors';
import paymentsLib from '../lib/payments';
import Promise from 'bluebird';

/**
 * Create a manual donation
 */
export const manual = (req, res, next) => {  
  const { order } = req.required;
  const { remoteUser } = req;
  const { collective } = req;
  const { amount, description, privateMessage } = order;

  if (!amount || amount < 0) {
    return Promise.reject(new Error('Amount must be greater than 0'));
  }

  let user = remoteUser;
  let promise = Promise.resolve();

  // if donation is on someone else's behalf, find or create that user
  if (order.email && order.email !== remoteUser.email) {
    promise = models.User.findOrCreateByEmail(order.email, models.User.splitName(order.name))
    .tap(u => user = u)
  }

  return promise
    .then(() => models.Order.create({
      UserId: user.id,
      CollectiveId: collective.id,
      currency: collective.currency,
      amount,
      description,
      privateMessage
    }))
    .then(order => paymentsLib.processPayment(order))
    .then(() => res.send({success: true}))
    .catch(err => next(new errors.BadRequest(err.message)));
};


/*
const paypalDonation = (req, res, next) => {
  const { collective } = req;
  const { payment } = req.required;
  const currency = payment.currency || collective.currency;
  const amount = parseInt(payment.amount * 100, 10);
  const { interval } = payment;
  const isSubscription = _.contains(['month', 'year'], interval);
  const distribution = payment.distribution ? JSON.stringify({distribution: payment.distribution}) : '';

  if (interval && !isSubscription) {
    return next(new errors.BadRequest('Interval should be month or year.'));
  }

  if (!payment.amount) {
    return next(new errors.BadRequest('Payment Amount missing.'));
  }

  async.auto({

    getConnectedAccount: (cb) => {
      collective.getConnectedAccount()
        .tap(connectedAccount => cb(null, connectedAccount))
        .catch(cb);
    },

    createSubscription: ['getConnectedAccount', (cb) => {
      if (isSubscription) {
        models.Subscription.create({
            amount,
            currency,
            interval
          })
        .then(subscription => cb(null, subscription))
        .catch(cb)
      } else {
        cb();
      }
    }],

    // We create the transaction beforehand to have the id in the return url when
    // the user logs on the PayPal website
    createTransaction: ['createSubscription', (cb, results) => {
      const payload = {
        collective,
        transaction: {
          type: 'payment',
          amount,
          currency,
          description: payment.description || `Donation to ${collective.name}`,
          tags: ['Donation'],
          comment: distribution,
          // In paranoid mode, the deleted transactions are not visible
          // We will create that temporary transaction that will only be visible once
          // the user executes the paypal token
          deletedAt: new Date()
        }
      };

     if (isSubscription) {
        payload.subscription = results.createSubscription;
      }

      models.Transaction.createFromPayload(payload)
      .then(t => cb(null, t))
      .catch(cb);
    }],

    callPaypal: ['createTransaction', (cb, results) => {
      const connectedAccount = results.getConnectedAccount;
      const transaction = results.createTransaction;

      if (isSubscription) {
        paypal.createSubscription(
          connectedAccount,
          collective,
          transaction,
          results.createSubscription
        , cb);
      } else {
        paypal.createPayment(
          connectedAccount,
          collective,
          transaction
        , cb);
      }
    }],

    updateSubscription: ['callPaypal', (cb, results) => {
      if (!isSubscription) return cb();

      const transaction = results.createTransaction;

      transaction.getSubscription()
        .then((subscription) => {
          subscription.data = results.callPaypal.billingAgreement;

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

    const links = isSubscription
      ? results.callPaypal.billingAgreement.links
      : results.callPaypal.links

    res.send({
      success: true,
      links
    });
  });

};
export {paypalDonation as paypal};


export const paypalCallback = (req, res, next) => {
  const transaction = req.paranoidtransaction;
  const { collective } = req;
  const { token } = req.query;

  // For single payments
  const { paymentId } = req.query;
  const { PayerID } = req.query;

  const isSubscription = !paymentId || !PayerID;

  if (!token) {
    return next(new errors.BadRequest('Token to execute agreement is missing'));
  }

  async.auto({
    getConnectedAccount: (cb) => {
      req.collective.getConnectedAccount()
        .then(connectedAccount => cb(null, connectedAccount))
        .catch(cb);
    },

    execute: ['getConnectedAccount', (cb, results) => {
      paypal.execute(
        results.getConnectedAccount,
        req.query.token,
        req.query.paymentId,
        req.query.PayerID
      , cb)
    }],

    createActivity: ['execute', (cb, results) => {
      models.Activity.create({
        type: activities.WEBHOOK_PAYPAL_RECEIVED,
        data: {
          transaction: transaction.info,
          executionResult: results.execute
        }
      })
        .then(activity => cb(null, activity))
        .catch(cb);
    }],

    activateSubscription: ['createActivity', (cb, results) => {
      if (!isSubscription) return cb();

      transaction.getSubscription()
        .then(subscription => {
          const billingAgreementId = results.execute.id;
          subscription.data = _.extend({}, subscription.data, { billingAgreementId });
          subscription.isActive = true;

          return subscription.save();
        })
        .then(subscription => cb(null, subscription))
        .catch(cb);
    }],

    getOrCreateUser: ['activateSubscription', (cb, results) => {
      const { email } = results.execute.payer.payer_info;

      getOrCreateUser({ email }, cb);
    }],

    createDonation: ['getOrCreateUser', (cb, results) => {
      const user = results.getOrCreateUser;
      const { currency } = transaction;
      const amountFloat = transaction.amount; // TODO: clean this up when we switch all amounts to INTEGER
      const amountInt = parseInt(amountFloat * 100, 10); // TODO: clean this up when we switch all amounts to INTEGER
      const subscriptionId = results.activateSubscription && results.activateSubscription.id;

      const donation = {
        UserId: user.id,
        CollectiveId: collective.id,
        currency,
        amount: amountInt,
        description: `Donation to ${collective.name}`,
        SubscriptionId: subscriptionId
      };

      models.Order.create(order)
        .then(order => transaction.setDonation(order))
        .then(order => cb(null, order))
        .catch(cb);
    }],

    addUserToCollective: ['getOrCreateUser', (cb, results) => {
      const user = results.getOrCreateUser;

      models.Member.findOne({
        where: {
          CollectiveId: collective.id,
          UserId: user.id,
          role: roles.BACKER
        }
      })
      .then(Member => Member || collective.addUserWithRole(user, roles.BACKER))
      .then(() => cb())
      .catch(cb);
    }],

    updateTransaction: ['addUserToCollective', (cb, results) => {
      transaction.restore() // removes the deletedAt field http://docs.sequelizejs.com/en/latest/api/instance/#restoreoptions-promiseundefined
        .then(() => transaction.setUser(results.getOrCreateUser))
        .then(() => models.Transaction.createActivity(transaction))
        .then(() => cb())
        .catch(cb);
    }]
  }, (err, results) => {
    if (err) return next(err);
    const user = results.getOrCreateUser;

    res.redirect(`${config.host.website}/${req.collective.slug}?status=payment_success&userid=${user.id}&has_full_account=${!user.hasMissingInfo()}`);
  });

};
*/