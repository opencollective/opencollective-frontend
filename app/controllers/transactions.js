/**
 * Dependencies.
 */
var utils = require('../lib/utils');
var _ = require('lodash');
var async = require('async');

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
   }

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

    _create: create

  }

};
