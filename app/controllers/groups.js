/**
 * Dependencies.
 */
var _ = require('lodash');
var async = require('async');
var utils = require('../lib/utils');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var errors = app.errors;
  var models = app.set('models');
  var sequelize = models.sequelize;
  var Group = models.Group;
  var Activity = models.Activity;
  var User = models.User;
  var Transaction = models.Transaction;
  var UserGroup = models.UserGroup;
  var StripeManagedAccount = models.StripeManagedAccount;
  var transactions = require('../controllers/transactions')(app);

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
          type: 'group.user.added',
          GroupId: group.id,
          data: {
            group: group.info,
            user: options.remoteUser.info,
            target: user.info,
            usergroup: usergroup.info
          }
        };
        Activity.create(_.extend({UserId: options.remoteUser.id}, activity));
        if (user.id !== options.remoteUser.id)
          Activity.create(_.extend({UserId: user.id}, activity));
      })
      .catch(callback);
  };

  var getBalance = function(id, cb) {
    Transaction
      .find({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        where: {
          GroupId: id,
          approved: true
        }
      })
      .then(function(result) {
        cb(null, result.toJSON().total);
      })
      .catch(cb);
  };

  var getPublicPageInfo = function(id, cb) {
    Transaction
      .find({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('amount')), 'donationTotal'],
          [sequelize.fn('COUNT', sequelize.col('UserId')), 'backersCount']
        ],
        where: {
          GroupId: id,
          approved: true,
          amount: {
            $gt: 0
          }
        }
      })
      .then(function(result) {
        var json = result.toJSON();

        cb(null, {
          donationTotal: Number(json.donationTotal),
          backersCount: Number(json.backersCount)
        });
      })
      .catch(cb);
  };

  var getUsers = function(req, res, next) {

    /**
     * Doing this in SQL because could not find how to do it with sequelize
     */
    var sql = 'SELECT * FROM "UserGroups" ' +
              'LEFT JOIN "Users" ' +
              'ON "UserId" = "id" ' +
              'WHERE "GroupId" = :GroupId';

    sequelize.query(sql, {
      replacements: {
        GroupId: req.group.id
      },

      // we could pass the model but it only works with sequelize >= 3.0.0
      type: sequelize.QueryTypes.SELECT
    })
    .map(function createUserInstance(userData) {
      return User.build(userData).public; // only return public data
    })
    .then(res.send.bind(res))
    .catch(next);
  };

  var updateTransaction = function(req, res, next) {

    ['paymentMethod', 'tags'].forEach(function(prop) {
      if (req.required.transaction[prop]) {
        req.transaction[prop] = req.required.transaction[prop];
      }
    });

    req.transaction.updatedAt = new Date();

    req.transaction
      .save()
      .then(function(transaction) {
        res.send(transaction.info);
      })
      .catch(next);
  };

  /**
   * Public methods.
   */
  return {

    /**
     * Create a group.
     */
    create: function(req, res, next) {
      Group
        .create(req.required.group)
        .then(function(group) {

          // Create activity.
          Activity.create({
            type: 'group.created',
            UserId: req.remoteUser.id,
            GroupId: group.id,
            data: {
              group: group.info,
              user: req.remoteUser.info
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
              };
              addGroupMember(group, req.remoteUser, options, cb);
            },
            createStripeManagedAccount: function(cb) {
              app.stripe.accounts.create({
                email: req.required.group.stripeEmail || req.remoteUser.email
              }, function(e, account) {
                if (e) return cb(e);

                StripeManagedAccount
                  .create({
                    stripeId: account.id,
                    stripeSecret: account.keys.secret,
                    stripeKey: account.keys.publishable,
                    stripeEmail: account.email
                  })
                  .then(function(account) {
                    account.addGroup(group.id).done(cb);
                  })
                  .catch(cb);
              });
            }
          }, function(e) {
            if (e) return next(e);
            res.send(group.info);
          });

        })
        .catch(next);
    },

    /**
     * Update.
     */
    update: function(req, res, next) {
      ['name',
       'description',
       'budget',
       'currency',
       'longDescription',
       'logo',
       'video',
       'image',
       'expensePolicy',
       'membershipType',
       'membershipfee',
       'isPublic'].forEach(function(prop) {
        if (req.required.group[prop])
          req.group[prop] = req.required.group[prop];
      });
      req.group.updatedAt = new Date();

      req.group
        .save()
        .then(function(group) {
          res.send(group.info);
        })
        .catch(next);
    },

    /**
     * Get group content.
     */
    get: function(req, res, next) {

      async.auto({

        getBalance: getBalance.bind(this, req.group.id),
        getPublicPageInfo: getPublicPageInfo.bind(this, req.group.id),

        getActivities: function(cb) {
          if (!req.query.activities && !req.body.activities)
            return cb();

          var query = {
            where: {
              GroupId: req.group.id
            },
            order: [['createdAt', 'DESC']],
            offset: 0,
            limit: 20 // [TODO] I need to put this default value
            // as a global parameter. Using mw.paginate?
          };

          Activity
            .findAndCountAll(query)
            .then(function(activities) {
              cb(null, activities.rows);
            })
            .catch(cb);
        },

        getStripeManagedAccount: function(cb) {
          req.group.getStripeManagedAccount()
            .done(cb);
        }

      }, function(e, results) {
        if (e) return next(e);

        var group = req.group.info;
        group.balance = results.getBalance;
        group.backersCount = results.getPublicPageInfo.backersCount;
        group.donationTotal = results.getPublicPageInfo.donationTotal;

        if (results.getActivities) {
          group.activities = results.getActivities;
        }

        if (results.getStripeManagedAccount) {
          group.stripeManagedAccount = _.pick(results.getStripeManagedAccount,
                                              'stripeKey');
        }

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
      };
      addGroupMember(req.group, req.user, options, function(e) {
        if (e) return next(e);
        else res.send({success: true});
      });
    },

    /**
     * Update a member.
     */
    updateMember: function(req, res, next) {
      var query = {
        where: {
          GroupId: req.group.id,
          UserId: req.user.id
        }
      };

      models
        .UserGroup
        .findOne(query)
        .then(function(usergroup) {
          if (!usergroup) {
            throw (new errors.NotFound('The user is not part of the group yet.'));
          }

          return usergroup;
        })
        .then(function(usergroup) {
          ['role'].forEach(function(prop) {
            if (req.body[prop])
              usergroup[prop] = req.body[prop];
          });
          usergroup.updatedAt = new Date();

          return usergroup
            .save();
        })
        .then(function(usergroup) {
          // Create activities.
          var remoteUser = (req.remoteUser && req.remoteUser.info) || (req.application && req.application.info);
          var activity = {
            type: 'group.user.updated',
            GroupId: req.group.id,
            data: {
              group: req.group.info,
              user: remoteUser,
              target: req.user.info,
              usergroup: usergroup.info
            }
          };
          Activity.create(_.extend({UserId: req.user.id}, activity));
          if (req.remoteUser && req.user.id !== req.remoteUser.id)
            Activity.create(_.extend({UserId: req.remoteUser.id}, activity));

          return usergroup;
        })
        .then(function(usergroup) {
          res.send(usergroup);
        })
        .catch(next);
    },

    /**
     * Delete a member.
     */
    deleteMember: function(req, res, next) {
      var query = {
        where: {
          GroupId: req.group.id,
          UserId: req.user.id
        }
      };

      models
        .UserGroup
        .findOne(query)
        .then(function(usergroup) {
          if (!usergroup) {
            throw (new errors.NotFound('The user is not part of the group yet.'));
          }

          return usergroup;
        })
        .then(function(usergroup) {
          return usergroup.destroy();
        })
        .then(function() {
          // Create activities.
          var remoteUser = (req.remoteUser && req.remoteUser.info) || (req.application && req.application.info);
          var activity = {
            type: 'group.user.deleted',
            GroupId: req.group.id,
            data: {
              group: req.group.info,
              user: remoteUser,
              target: req.user.info
            }
          };
          Activity.create(_.extend({UserId: req.user.id}, activity));
          if (req.remoteUser && req.user.id !== req.remoteUser.id)
            Activity.create(_.extend({UserId: req.remoteUser.id}, activity));
          return;
        })
        .then(function() {
          res.send({success: true});
        })
        .catch(next);
    },

    /**
     * Create a transaction and add it to a group.
     */
    createTransaction: function(req, res, next) {
      var transaction = req.required.transaction;
      var group = req.group;

      // Caller.
      var user = req.remoteUser || transaction.user || {};

      var t = {
        transaction: transaction,
        group: group,
        user: user
      };
      transactions._create(t, function(e, transactionCreated) {
        if (e) return next(e);
        res.send(transactionCreated);
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

         createActivity: ['deleteTransaction', function(cb) {
           Activity.create({
             type: 'group.transaction.deleted',
             UserId: user.id,
             GroupId: group.id,
             data: {
               group: group.info,
               transaction: transaction,
               user: user.info
             }
           }).done(cb);
         }]

       }, function(e) {
         if (e) return next(e);
         res.send({success: true});
       });

     },

    /**
     * Get group's transactions.
     */
    getTransactions: function(req, res, next) {
      var where = {
        GroupId: req.group.id
      };

      if (req.query.donation) {
        where.amount = {
          $gt: 0
        };
      } else if (req.query.expense) {
        where.amount = {
          $lt: 0
        };
      }

      var query = _.merge({
        where: where,
        order: [[req.sorting.key, req.sorting.dir]]
      }, req.pagination);

      Transaction
        .findAndCountAll(query)
        .then(function(transactions) {

          // Set headers for pagination.
          req.pagination.total = transactions.count;
          res.set({
            Link: utils.getLinkHeader(utils.getRequestedUrl(req),
                                        req.pagination)
          });

          res.send(_.pluck(transactions.rows, 'info'));
        })
        .catch(next);
    },

    /**
     * Get a group's transaction.
     */
    getTransaction: function(req, res, next) {
      res.json(req.transaction.info);
    },

    /**
     * Get the balance of a group
     * Also used in users controller
     */
    getBalance: getBalance,

    /**
     * Get users of a group
     */
    getUsers: getUsers,

    /**
     * Update transaction
     */
    updateTransaction: updateTransaction
  };

};
