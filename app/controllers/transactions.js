/**
 * Dependencies.
 */
var _ = require('lodash');
var async = require('async');
var config = require('config');
var utils = require('../lib/utils');
var uuid = require('node-uuid');

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
  var Paykey = models.Paykey;
  var User = models.User;
  var errors = app.errors;

  /**
   * Create a transaction and add it to a group/user/card.
   */
  var create = function(args, callback) {
    var transaction = args.transaction;
    var user = args.user || {};
    var group = args.group || {};
    var card = args.card || {};

    async.auto({

      createTransaction: function(cb) {
        Transaction
          .create(transaction)
          .done(cb);
      },

      addTransactionToUser: ['createTransaction', function(cb, results) {
        var transaction = results.createTransaction;

        if (user && user.addTransaction) {
          user
            .addTransaction(transaction)
            .done(cb);
        } else {
          cb();
        }
      }],

      addTransactionToGroup: ['createTransaction', function(cb, results) {
        var transaction = results.createTransaction;

        group
          .addTransaction(transaction)
          .done(cb);
      }],

      addTransactionToCard: ['createTransaction', function(cb, results) {
        var transaction = results.createTransaction;

        if (card && card.addTransaction) {
          card
            .addTransaction(transaction)
            .done(cb);
        } else {
          cb();
        }
      }],

      createActivity: ['createTransaction', function(cb, results) {
        var transaction = results.createTransaction;

        // Create activity.
        Activity.create({
          type: 'group.transaction.created',
          UserId: user.id,
          GroupId: group.id,
          TransactionId: transaction.id,
          data: {
            group: group.info,
            transaction: transaction,
            user: user.info,
            target: transaction.beneficiary,
            card: card.info
          }
        }).done(cb);
      }]

    }, function(e, results) {
      if (e) return callback(e);
      else callback(null, results.createTransaction);
    });
  };

  /**
   * Get a Paypal pay key.
   */
  var getPayKey = function(req, res, next) {
    var uri = '/groups/' + req.group.id + '/transactions/' + req.transaction.id;

    // Check if a user is attached to the transaction.
    var userId = req.transaction.UserId;
    if (!userId) {
      return next(new errors.BadRequest('A user has to be attached to the transaction to be reimburse. The URI ' + uri + '/attribution/:userid' + ' can be used to link a user to the transaction.'));
    }

    // Parameters.
    var amount = req.transaction.amount;
    var baseUrl = config.host.webapp + uri;
    var cancelUrl = req.query.cancelUrl || (baseUrl + '/cancel');
    var returnUrl = req.query.returnUrl || (baseUrl + '/success');

    // Calculate OpenCollective fee.
    function calculateOCfee(amount, feeOC) {
      return Math.round(amount * feeOC) / 100;
    }

    async.auto({

      getUser: function(cb) {
        User
          .find(parseInt(userId))
          .then(function(user) {
            if (!user) {
              return cb(new errors.NotFound('User ' + userid + ' not found'));
            } else {
              cb(null, user);
            }
          })
          .catch(cb);
      },

      createPaykeyEntry: function(cb) {
        Paykey.create({}).done(cb);
      },

      createPayload: ['getUser', 'createPaykeyEntry', function(cb, results) {
        var payload = {
          requestEnvelope: {
            errorLanguage: 'en_US',
            detailLevel: 'ReturnAll'
          },
          actionType: 'PAY',
          currencyCode: req.transaction.currency.toUpperCase() || 'USD',
          feesPayer: 'SENDER',
          memo: 'Reimbursement transaction ' + req.transaction.id + ': ' + req.transaction.description,
          cancelUrl: cancelUrl,
          returnUrl: returnUrl,
          trackingId: [uuid.v1().substr(0, 8), results.createPaykeyEntry.id].join(':'),
          receiverList: {
            receiver: [
              {
                email: results.getUser.email,
                amount: amount,
                paymentType: 'PERSONAL'
              },
              {
                email: config.paypal.classic.email,
                amount: calculateOCfee(amount, config.paypal.feeOC),
                paymentType: 'PERSONAL'
              }
            ]
          }
        };
        return cb(null, payload);
      }],

      callPaypal: ['createPayload', function(cb, results) {
        app.paypalAdaptive.pay(results.createPayload, cb);
      }],

      updatePaykeyEntry: ['createPaykeyEntry', 'createPayload', 'callPaypal', function(cb, results) {
        var paykey = results.createPaykeyEntry;
        paykey.trackingId = results.createPayload.trackingId;
        paykey.paykey = results.callPaypal.payKey;
        paykey.status = results.callPaypal.paymentExecStatus;
        paykey.payload = results.createPayload;
        paykey.data = results.callPaypal;
        paykey.save().done(cb);
      }],

      linkPaykeyTransaction: ['callPaypal', 'updatePaykeyEntry', function(cb, results) {
        req.transaction
          .addPaykey(results.updatePaykeyEntry)
          .done(cb);
      }]

    }, function(e, results) {
      if (e) return next(e);
      var response = results.callPaypal;
      response.transactionId = req.transaction.id;
      res.json(response);
    });

  };

  /**
   * Confirm a transaction payment.
   */
  var confirmPayment = function(req, res, next) {

    async.auto({

      callPaypal: [function(cb) {
        app.paypalAdaptive.paymentDetails({payKey: req.params.paykey}, function(err, response) {
          if (err) {
            return cb(new errors.BadRequest(response.error[0].message));
          }

          if (response.status !== 'COMPLETED') {
            return cb(new errors.BadRequest('This transaction is not paid yet.'));
          }

          cb(null, response);
        });
      }],

      updatePaykey: ['callPaypal', function(cb, results) {
        req.paykey.data = results.callPaypal;
        req.paykey.status = results.callPaypal.status;
        req.paykey.save().done(cb);
      }],

      updateTransaction: ['callPaypal', function(cb, results) {
        req.transaction.status = results.callPaypal.status;
        req.transaction.reimbursedAt = new Date();
        req.transaction.save().done(cb);
      }],

      cleanPaykeys: ['updatePaykey', function(cb, results) {
        Paykey
          .destroy({
            where: {
              TransactionId: req.transaction.id,
              paykey: {$ne: req.paykey.paykey}
            }
          })
          .done(cb);
      }],

      createActivity: ['callPaypal', 'updatePaykey', 'updateTransaction', function(cb, results) {
        var user = req.remoteUser || {};
        Activity.create({
          type: 'group.transaction.paid',
          UserId: user.id,
          GroupId: req.group.id,
          TransactionId: req.transaction.id,
          data: {
            group: req.group.info,
            transaction: req.transaction.info,
            user: user.info,
            pay: results.callPaypal
          }
        }).done(cb);
      }]

    }, function(err, results) {
      if (err) return next(err);
      else res.send(results.updateTransaction.info)
    });

  };

  /**
   * Attribute a transaction to a user.
   */
  var attributeUser = function(req, res, next) {
    req.transaction
      .setUser(req.user)
      .then(function(t) {
        res.send({success: true});
      })
      .catch(next);
  };

  /**
   * Public methods.
   */
  return {

    /**
     * (Dis)approve a transaction.
     */
    approve: function(req, res, next) {
      req.transaction.approved = req.required.approved;
      req.transaction.approvedAt = new Date();

      req.transaction
        .save()
        .then(function(transaction) {
          res.send({success: true});
        })
        .catch(next);
    },

    _create: create,
    getPayKey: getPayKey,
    confirmPayment: confirmPayment,
    attributeUser: attributeUser

  }

};
