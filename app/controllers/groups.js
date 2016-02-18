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
  var Activity = models.Activity;
  var Subscription = models.Subscription;
  var Group = models.Group;
  var Transaction = models.Transaction;
  var transactions = require('../controllers/transactions')(app);
  var roles = require('../constants/roles');
  var activities = require('../constants/activities');

  /**
   * Private methods.
   */
  var subscribeUserToGroupEvents = function(user, group, role) {
    if(role !== roles.HOST) return;
    Subscription.create({
      UserId: user.id,
      GroupId: group.id,
      type: activities.GROUP_TRANSANCTION_CREATED
    });
  }

  var addUserToGroup = function(group, user, options, callback) {

    async.auto({
      checkIfGroupHasHost: function(cb) {
        if (options.role !== roles.HOST) return cb();

        group.hasHost(function(err, hasHost) {
          if (err) return cb(err);
          if (hasHost) {
            cb(new errors.BadRequest('Group already has a host'));
          }

          cb();
        });

      },

      addUserToGroup: ['checkIfGroupHasHost', function(cb) {
        group.addUserWithRole(user, options.role)
          .done(cb);
      }],

      createActivity: ['addUserToGroup', function(cb) {
        var activity = {
          type: 'group.user.added',
          GroupId: group.id,
          data: {
            group: group.info,
            user: options.remoteUser.info,
            target: user.info,
            role: options.role
          }
        };

        Activity.create(activity)
          .done(cb);

      }]
    }, function(err) {
      if (err) return callback(err);
      callback();
    });
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

    req.group.getUsers({})
      .map(function(user) {
        return _.extend({}, user.public, { role: user.UserGroup.role });
      })
      .then(function(users) {
        res.send(users);
      })
      .catch(next);
  };

  var updateTransaction = function(req, res, next) {

    [
      'description',
      'link',
      'amount',
      'tags',
      'createdAt',
      'paymentMethod',
      'comment',
      'vat'
    ].forEach(function(prop) {
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

          async.series({

            createActivity: function(cb) {
              Activity.create({
                type: 'group.created',
                UserId: req.remoteUser.id,
                GroupId: group.id,
                data: {
                  group: group.info,
                  user: req.remoteUser.info
                }
              }).done(cb);
            },

            addUser: function(cb) {
              // Add caller to the group if `role` specified.
              var role = req.body.role;
              if (!role)
                return cb();
              var options = {
                role: role,
                remoteUser: req.remoteUser
              };
              addUserToGroup(group, req.remoteUser, options, cb);
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

        getStripeAccount: function(cb) {
          req.group.getStripeAccount(cb);
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

        if (results.getStripeAccount) {
          group.stripeAccount = _.pick(results.getStripeAccount, 'stripePublishableKey');
        }

        res.send(group);
      });

    },

    /**
     * Add a user to a group.
     */
    addUser: function(req, res, next) {
      var options = {
        role: req.body.role || roles.BACKER,
        remoteUser: req.remoteUser
      };

      addUserToGroup(req.group, req.user, options, function(e) {
        if (e) return next(e);
        subscribeUserToGroupEvents(req.user, req.group, options.role);
        res.send({success: true});
      });
    },

    /**
     * Update a user.
     */
    updateUser: function(req, res, next) {
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
    deleteUser: function(req, res, next) {
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
      } else if (req.query.pending) {
        where = _.extend({}, where, {
          amount: { $lt: 0 },
          approved: false,
          approvedAt: null
        });
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
    getTransaction: function(req, res) {
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
