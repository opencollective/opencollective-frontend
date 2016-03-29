/**
 * Dependencies.
 */
const _ = require('lodash');
const async = require('async');
const activities = require('../constants/activities');
const config = require('config');
const uuid = require('node-uuid');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');
  var Transaction = models.Transaction;
  var Activity = models.Activity;
  var Notification = models.Notification;
  var User = models.User;
  var PaymentMethod = models.PaymentMethod;
  var errors = app.errors;
  var emailLib = require('../lib/email')(app);
  var paypal = require('./paypal')(app);

  /**
   * Create a transaction and add it to a group/user/paymentMethod.
   */
  var create = (args, callback) => {
    var transaction = args.transaction;
    const subscription = args.subscription;
    var user = args.user || {};
    var group = args.group || {};
    var paymentMethod = args.paymentMethod || {};

    async.auto({

      createTransaction: (cb) => {
        Transaction
          .create(transaction)
          .then(t => {
            if (!subscription) return cb(null, t);

            return t.createSubscription(subscription)
              .then(() => cb(null, t));
          })
          .catch(cb)
      },

      addTransactionToUser: ['createTransaction', (cb, results) => {
        var transaction = results.createTransaction;

        if (user && user.addTransaction) {
          user
            .addTransaction(transaction)
            .done(cb);
        } else {
          cb();
        }
      }],

      addTransactionToGroup: ['createTransaction', (cb, results) => {
        var transaction = results.createTransaction;

        group
          .addTransaction(transaction)
          .done(cb);
      }],

      addTransactionToPaymentMethod: ['createTransaction', (cb, results) => {
        var transaction = results.createTransaction;

        if (paymentMethod.addTransaction) {
          paymentMethod
            .addTransaction(transaction)
            .done(cb);
        } else {
          cb();
        }
      }],

      createActivity: ['createTransaction', (cb, results) => {
        var transaction = results.createTransaction;

        // Create activity.
        Activity.create({
          type: activities.GROUP_TRANSACTION_CREATED,
          UserId: user.id,
          GroupId: group.id,
          TransactionId: transaction.id,
          data: {
            group: group.info,
            transaction: transaction,
            user: user.info,
            paymentMethod: paymentMethod.info
          }
        }).done(cb);
      }],

      notifySubscribers: ['createActivity', (cb, results) => {
        var activity = results.createActivity;

        Notification.findAll({
          include:{
            model: User,
            attributes: ['email']
          },
          where: {
            type: activity.type,
            GroupId: activity.GroupId
          }
        }).then((notifications) => {
          return notifications.map((s) => emailLib.send(activity.type, s.User.email, activity.data))
        })
        .then(() => cb())
        .catch((err) => {
          console.error(`Unable to fetch subscribers of ${activity.type} for group ${activity.GroupId}`, err);
        });
      }]

    }, (e, results) => {
      if (e) return callback(e);
      else callback(null, results.createTransaction);
    });
  };

var payServices = {
  paypal: (data, callback) => {
    var uri = `/groups/${data.group.id}/transactions/${data.transaction.id}/paykey/`;
    var baseUrl = config.host.webapp + uri;
    var amount = data.transaction.amount;
    var payload = {
      requestEnvelope: {
        errorLanguage: 'en_US',
        detailLevel: 'ReturnAll'
      },
      actionType: 'PAY',
      currencyCode: data.transaction.currency.toUpperCase() || 'USD',
      feesPayer: 'SENDER',
      memo: `Reimbursement transaction ${data.transaction.id}: ${data.transaction.description}`,
      trackingId: [uuid.v1().substr(0, 8), data.transaction.id].join(':'),
      preapprovalKey: data.paymentMethod.token,
      returnUrl: `${baseUrl}/success`,
      cancelUrl: `${baseUrl}/cancel`,
      receiverList: {
        receiver: [
          {
            email: data.beneficiary.paypalEmail || data.beneficiary.email,
            amount: amount,
            paymentType: 'SERVICE'
          }
        ]
      }
    };

    app.paypalAdaptive.pay(payload, callback);
  }

};

  /**
   * Pay a transaction.
   */
  var pay = function(req, res, next) {
    var service = req.required.service;
    var user = req.remoteUser;
    var group = req.group;
    var transaction = req.transaction;
    var isManual = transaction.payoutMethod !== 'paypal';

    async.auto({

      checkTransaction: [function(cb) {
        if(!transaction.UserId) {
          return next(new errors.BadRequest(`Transaction id ${transaction.id} doesn't have a UserId.`));
        }

        if (transaction.reimbursedAt) {
          return cb(new errors.BadRequest(`Transaction id ${transaction.id} has been paid already.`));
        }

        if (!transaction.approved) {
          return cb(new errors.BadRequest(`Transaction id ${transaction.id} has not been approved yet.`));
        }

        if (transaction.amount >= 0) {
          return cb(new errors.BadRequest(`Transaction id ${transaction.id} is a donation, it can\'t be reimbursed.`));
        }

        cb();
      }],

      getPaymentMethod: [function(cb) {
        if (isManual) {
          return cb(null, {});
        }

        PaymentMethod
          .findAndCountAll({
            where: {
              service: service,
              UserId: user.id,
              confirmedAt: {$ne: null}
            },
            order: [['confirmedAt', 'DESC']]
          })
          .done(cb);
      }],

      checkPaymentMethod: ['getPaymentMethod', function(cb, results) {
        if (isManual) {
          return cb(null, {});
        } else if (results.getPaymentMethod.count === 0) {
          return cb(new errors.BadRequest('This user has no confirmed paymentMethod linked with this service.'));
        } else {
          return cb(null, results.getPaymentMethod.rows[0]); // Use first paymentMethod.
        }
      }],

      getBeneficiary: ['checkTransaction', function(cb) {
        User
          .find(parseInt(transaction.UserId))
          .then((user) => {
            if (!user) {
              return cb(new errors.NotFound(`Beneficiary ${userid} not found`));
            } else {
              cb(null, user);
            }
          })
          .catch(cb);
      }],

      callService: ['checkTransaction', 'checkPaymentMethod', 'getBeneficiary', function(cb, results) {
        if (isManual) {
          return cb(null, {});
        }

        if (!payServices[service]) {
          return cb(new errors.NotImplemented('This service is not implemented yet for payment.'));
        }

        /**
         * #TODO
         * We should verify that there is enough money left on the preapprovalKey (paymentMethod.token)
         * If we send it to payServices['paypal']() with not enough money left, it will fail (gracefully)
         * If we don't send it, it will return a `paymentApprovalUrl` that we can use to redirect the user
         * to PayPal.com to manually approve the payment.
         * 
         * Expenses are stored with negative values in the backend but paypal
         * wants positive values in the API, we will change the sign of the amount
         */
        payServices[service]({
          paymentMethod: results.checkPaymentMethod,
          group: group,
          transaction: _.extend({}, transaction.toJSON(), { amount: -transaction.amount }),
          beneficiary: results.getBeneficiary,
        }, cb);
      }],

      updateTransaction: ['checkPaymentMethod', 'callService', function(cb, results) {
        if (isManual) {
          transaction.status = 'REIMBURSED';
          transaction.reimbursedAt = new Date();
          return transaction.save().done(cb);
        }

        switch(results.callService.paymentExecStatus) {
          case 'COMPLETED':
            transaction.PaymentMethodId = results.checkPaymentMethod.id;
            transaction.status = 'REIMBURSED';
            transaction.reimbursedAt = new Date();
            return transaction.save().done(cb);
            break;
          case 'CREATED':
            /*
            * #TODO
            * When we don't provide a preapprovalKey (paymentMethod.token) to payServices['paypal'](),
            * it creates a payKey that we can use to redirect the user to PayPal.com to manually approve that payment
            * We should handle that case on the frontend (app.opencollective.com)
            */
            return cb(new errors.BadRequest(`Please approve this payment manually on ${results.callService.paymentApprovalUrl}`));
            break;
          default:
            return cb(new errors.ServerError(`controllers.transactions.pay: Unknown error while trying to update transaction ${transaction.id}`));
        }
      }],

      createActivity: ['callService', 'updateTransaction', function(cb, results) {
        Activity.create({
          type: activities.GROUP_TRANSACTION_PAID,
          UserId: user.id,
          GroupId: group.id,
          TransactionId: results.updateTransaction.id,
          data: {
            group: group.info,
            transaction: results.updateTransaction.info,
            user: user.info,
            pay: results.callService
          }
        }).done(cb);
      }]

    }, (err, results) => {
      if (err && results.callService) {
        console.error('PayPal error', JSON.stringify(results.callService));
        if (results.callService.error instanceof Array) {
          var message = results.callService.error[0].message;
          return next(new errors.BadRequest(message));
        }
      }

      if (err) return next(err);
      else res.json(results.updateTransaction);
    });

  };

  /**
   * Attribute a transaction to a user.
   */
  var attributeUser = function(req, res, next) {
    req.transaction
      .setUser(req.user)
      .then(() => res.send({success: true}))
      .catch(next);
  };

  const approve = (req, res, next) => {
    if (req.required.approved === false) {
      req.transaction.approved = req.required.approved;
      req.transaction.approvedAt = new Date();

      req.transaction
        .save()
        .then(() => res.send({success: true}))
        .catch(next);
    }

    // We need to check the funds before approving a transaction
    async.auto({
      fetchPaymentMethods: (cb) => {
        PaymentMethod.findAll({
          where: {
            service: 'paypal',
            UserId: req.remoteUser.id
          }
        })
        .done(cb);
      },

      getPreapprovalDetails: ['fetchPaymentMethods', (cb, results) => {
        const paymentMethod = results.fetchPaymentMethods[0];

        if (!paymentMethod || !paymentMethod.token) {
          return cb(new errors.BadRequest('You can\'t approve a transaction without linking your PayPal account'));
        }

        paypal.getPreapprovalDetails(paymentMethod.token, cb);
      }],

      checkIfEnoughFunds: ['getPreapprovalDetails', (cb, results) => {
        const maxAmount = Number(results.getPreapprovalDetails.maxTotalAmountOfAllPayments);
        const currency = results.getPreapprovalDetails.currencyCode;

        if (Math.abs(req.transaction.amount) > maxAmount) {
          return cb(new errors.BadRequest(`Not enough funds (${maxAmount} ${currency} left) to approve transaction.`));
        }

        cb();
      }]
    }, (err, results) => {
      if (err && results.getPreapprovalDetails) {
        console.error('PayPal error', JSON.stringify(results.getPreapprovalDetails));
        if (results.getPreapprovalDetails.error instanceof Array) {
          var message = results.getPreapprovalDetails.error[0].message;
          return next(new errors.BadRequest(message));
        }
      }

      if (err) return next(err);

      req.transaction.approved = true;
      req.transaction.approvedAt = new Date();

      req.transaction
        .save()
        .then(() => res.send({success: true}))
        .catch(next);

    });
  };

  /**
   * Get subscriptions of a user
   */
  const getSubscriptions = (req, res, next) => {
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
   * Public methods.
   */
  return {
    approve,
    _create: create,
    pay,
    attributeUser,
    getSubscriptions
  }

};
