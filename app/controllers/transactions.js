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
    var uri = '/groups/' + req.group.id + '/transactions/' + req.transaction.id + '/paykey/${payKey}';

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

      getExistingPaykeys: ['getUser', function(cb) {
        Paykey
          .findAndCountAll({
            where: {
              TransactionId: req.transaction.id
            }
          })
          .done(cb);
      }],

      checkExistingPaykeys: ['getExistingPaykeys', function(cb, results) {
        async.each(results.getExistingPaykeys.rows, function(pk, cbEach) {
          app.paypalAdaptive.paymentDetails({payKey: pk.paykey}, function(err, response) {
            if (err || response.status === 'CREATED') {
              pk.destroy().done(cbEach);
            } else if (response.status === 'COMPLETED') {
              _confirmPaymentDatabase({
                paykey: pk,
                transaction: req.transaction,
                group: req.group,
                paypalResponse: response,
                user: req.remoteUser
              }, function(e, transaction) {
                if (e) return cbEach(e);
                else return cbEach(new errors.BadRequest('This transaction has been paid already.'));
              });
            } else {
              cbEach();
            }
          });
        }, cb);
      }],

      createPaykeyEntry: ['checkExistingPaykeys', function(cb) {
        Paykey.create({}).done(cb);
      }],

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
   * Confirm the payment in the database:
   *  - update paykey
   *  - update transaction
   *  - clean not used paykeys
   *  - create an activity
   *  Returns the transaction.
   */
  var _confirmPaymentDatabase = function(args, callback) {
    var paykey = args.paykey; // model
    var transaction = args.transaction; // model
    var group = args.group; // model
    var paypalResponse = args.paypalResponse; // response from paypal paymentDetails
    var user = args.user || {};

    async.auto({

      updatePaykey: [function(cb, results) {
        paykey.data = paypalResponse;
        paykey.status = paypalResponse.status;
        paykey.save().done(cb);
      }],

      updateTransaction: [function(cb, results) {
        transaction.status = paypalResponse.status;
        transaction.reimbursedAt = new Date();
        transaction.save().done(cb);
      }],

      cleanPaykeys: ['updatePaykey', function(cb, results) {
        Paykey
          .destroy({
            where: {
              TransactionId: transaction.id,
              paykey: {$ne: paykey.paykey}
            }
          })
          .done(cb);
      }],

      createActivity: ['updatePaykey', 'updateTransaction', function(cb, results) {
        Activity.create({
          type: 'group.transaction.paid',
          UserId: user.id,
          GroupId: group.id,
          TransactionId: transaction.id,
          data: {
            group: group.info,
            transaction: transaction.info,
            user: user.info,
            pay: paypalResponse
          }
        }).done(cb);
      }]

    }, function(err, results) {
      if (err) return callback(err);
      else callback(null, results.updateTransaction);
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

      confirmPaymentDatabase: ['callPaypal', function(cb, results) {
        _confirmPaymentDatabase({
          paykey: req.paykey,
          transaction: req.transaction,
          group: req.group,
          paypalResponse: results.callPaypal,
          user: req.remoteUser
        }, cb);
      }]

    }, function(err, results) {
      if (err) return next(err);
      else res.send(results.confirmPaymentDatabase.info)
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
