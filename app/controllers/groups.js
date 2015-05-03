/**
 * Dependencies.
 */
var _ = require('lodash');
var async = require('async');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models')
    , Group = models.Group
    , Activity = models.Activity
    , Transaction = models.Transaction
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

          // Add caller to the group if `role` specified.
          var role = req.body.role;
          if (role) {
            var options = {
              role: role,
              remoteUser: req.remoteUser
            }
            addGroupMember(group, req.remoteUser, options, function(e) {
              if (e) return next(e);
              else res.send(group.info);
            });
          } else {
            res.send(group.info);
          }
        })
        .catch(next);
    },

    /**
     * Get group content.
     */
    get: function(req, res, next) {
      res.send(req.group.info);
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
       req.transaction
         .destroy()
         .then(function() {
           res.send({success: true});
         })
         .catch(next);
     },


  }

};
