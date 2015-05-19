/**
 * Dependencies.
 */
var _ = require('lodash');
var async = require('async');
var sequelize = require('sequelize');
var utils = require('../lib/utils');
var config = require('config');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models')
    , User = models.User
    , Group = models.Group
    , Activity = models.Activity
    , Transaction = models.Transaction
    , StripeManagedAccount = models.StripeManagedAccount
    , errors = app.errors
    ;

  /**
   * Private methods.
   */
  var addGroupMember = function(group, user, options, callback) {
    group
      .addMember(user, {role: options.role})
      .then(function(usergroup) {
        callback();

        // Create activities.
        var activity = {
            type: 'group.user.added'
          , GroupId: group.id
          , data: {
                group: group.info
              , user: options.remoteUser.info
              , target: user.info
              , usergroup: usergroup.info
            }
        };
        Activity.create(_.extend({UserId: options.remoteUser.id}, activity));
        if (user.id !== options.remoteUser.id)
          Activity.create(_.extend({UserId: user.id}, activity));
      })
      .catch(callback);
  }

  /**
   * Public methods.
   */
  return {

    /**
     * Create a group.
     */
    create: function(req, res, next) {
      Group
        .create(req.required['group'])
        .then(function(group) {

          // Create activity.
          Activity.create({
              type: 'group.created'
            , UserId: req.remoteUser.id
            , GroupId: group.id
            , data: {
                  group: group.info
                , user: req.remoteUser.info
              }
          });

          async.series({
            addMember: function(cb) {
              // Add caller to the group if `role` specified.
              var role = req.body.role;
              if (!role)
                return cb();
              var options = {
                role: role,
                remoteUser: req.remoteUser
              }
              addGroupMember(group, req.remoteUser, options, cb);
            },
            createStripeManagedAccount: function(cb) {
              app.stripe.accounts.create({
                managed: true
              }, function(e, account) {
                console.log('hello here in controllers : ', e, account);
                if (e) return cb(e);
                StripeManagedAccount
                  .create({
                    stripeId: account.id,
                    stripeSecret: account.keys.secret,
                    stripeKey: account.keys.publishable
                  })
                  .then(function(account) {
                    account.addGroup(group.id).done(cb);
                  })
                  .catch(cb);
              })
            },
          }, function(e) {
            if (e) return next(e);
            res.send(group.info);
          });

        })
        .catch(next);
    },


    /**
     * Get group content.
     */
    get: function(req, res, next) {

      async.auto({

        getTotalTransactions: function(cb) {
          Transaction
            .find({
              attributes: [
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
              ],
              where: {
                GroupId: req.group.id
              }
            })
            .then(function(result) {
              cb(null, result.toJSON().total);
            })
            .catch(cb);
        },

        getActivities: function(cb) {
          if (!req.query.activities && !req.body.activities)
            return cb();

          var query = {
            where: {
              GroupId: req.group.id
            },
            order: [ ['createdAt', 'DESC'] ],
            offset: 0,
            limit: 20, // [TODO] I need to put this default value as a global parameter. Using mw.paginate?
          };

          Activity
            .findAndCountAll(query)
            .then(function(activities) {
              cb(null, activities.rows);
            })
            .catch(cb);
        },

      }, function(e, results) {

        var group = req.group.info;
        group.budgetLeft = group.budget + results.getTotalTransactions;
        if (results.getActivities)
          group.activities = results.getActivities;
        res.send(group);

      });

    },


    /**
     * Add a user to a group.
     */
    addMember: function(req, res, next) {
      var options = {
        role: req.body.role || 'viewer',
        remoteUser: req.remoteUser
      }
      addGroupMember(req.group, req.user, options, function(e) {
        if (e) return next(e);
        else res.send({success: true});
      });
    },


    /**
     * Create a transaction and add it to a group.
     */
    createTransaction: function(req, res, next) {
      var transaction = req.required['transaction'];
      var group = req.group;

      // Caller.
      var user = req.remoteUser || transaction.user || {};

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

        createActivity: ['createTransaction', function(cb, results) {
          var transaction = results.createTransaction;

          // Create activity.
          Activity.create({
              type: 'group.transaction.created'
            , UserId: user.id
            , GroupId: group.id
            , TransactionId: transaction.id
            , data: {
                  group: group.info
                , transaction: transaction
                , user: user.info
                , target: transaction.beneficiary
              }
          }).done(cb);
        }],

      }, function(e, results) {
        if (e) return next(e);
        res.send(results.createTransaction);
      });

    },


    /**
     * Delete a transaction.
     */
     deleteTransaction: function(req, res, next) {
       var transaction = req.transaction;
       var group = req.group;
       var user = req.remoteUser || {};

       async.auto({

         deleteTransaction: function(cb) {
           transaction
             .destroy()
             .done(cb);
         },

         createActivity: ['deleteTransaction', function(cb, results) {
           Activity.create({
               type: 'group.transaction.deleted'
             , UserId: user.id
             , GroupId: group.id
             , data: {
                   group: group.info
                 , transaction: transaction
                 , user: user.info
               }
           }).done(cb);
         }],

       }, function(e, results) {
         if (e) return next(e);
         res.send({success: true});
       });

     },


     /**
      * Get group's transactions.
      */
      getTransactions: function(req, res, next) {
        var query = _.merge({
          where: {
            GroupId: req.group.id
          },
          order: [ [req.sorting.key, req.sorting.dir] ]
        }, req.pagination);

        Transaction
          .findAndCountAll(query)
          .then(function(transactions) {

            // Set headers for pagination.
            req.pagination.total = transactions.count;
            res.set({
              'Link': utils.getLinkHeader(utils.getRequestedUrl(req), req.pagination)
            });

            res.send(transactions.rows);
          })
          .catch(next);
      },


  }

};
