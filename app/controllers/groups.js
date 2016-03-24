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
  var Notification = models.Notification;
  var Group = models.Group;
  var Transaction = models.Transaction;
  var transactions = require('../controllers/transactions')(app);
  var roles = require('../constants/roles');
  var activities = require('../constants/activities');

  /**
   * Returns all the users of a group with their `totalDonations` and `role` (HOST/MEMBER/BACKER)
   */
  const getUsersQuery = (GroupId) => {
    return sequelize.query(`
      WITH total_donations AS (
        SELECT
          max("UserId") as "UserId",
          SUM(amount) as amount
        FROM "Transactions" t
        WHERE t."GroupId" = :GroupId AND t.amount >= 0
        GROUP BY "UserId"
      )
      SELECT
        ug."UserId" as id,
        ug."createdAt" as "createdAt",
        u.name as name,
        ug.role as role,
        u.avatar as avatar,
        u.website as website,
        u."twitterHandle" as "twitterHandle",
        d.amount as "totalDonations"
      FROM "UserGroups" ug
      LEFT JOIN "Users" u ON u.id = ug."UserId"
      LEFT JOIN total_donations d ON d."UserId" = ug."UserId"
      WHERE ug."GroupId" = :GroupId
      ORDER BY "totalDonations" DESC
    `, {
      replacements: { GroupId },
      type: sequelize.QueryTypes.SELECT
    });
  };

  const subscribeUserToGroupEvents = (user, group, role) => {
    if(role !== roles.HOST) return;

    Notification.create({
      UserId: user.id,
      GroupId: group.id,
      type: activities.GROUP_TRANSACTION_CREATED
    });
  }

  const addUserToGroup = (group, user, options, callback) => {
    async.auto({
      checkIfGroupHasHost: (cb) => {
        if (options.role !== roles.HOST) {
          return cb();
        }

        group.hasHost((err, hasHost) => {
          if (err) {
            return cb(err);
          } else if (hasHost) {
            return cb(new errors.BadRequest('Group already has a host'));
          }

          cb();
        });

      },

      addUserToGroup: ['checkIfGroupHasHost', (cb) => {
        group.addUserWithRole(user, options.role)
          .done(cb);
      }],

      createActivity: ['addUserToGroup', (cb) => {
        Activity.create({
          type: 'group.user.added',
          GroupId: group.id,
          data: {
            group: group.info,
            user: options.remoteUser.info,
            target: user.info,
            role: options.role
          }
        }).done(cb);

      }]
    }, (err) => {
      callback(err);
    });
  };

  const getBalance = (id, cb) => {
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
      .then((result) => cb(null, result.toJSON().total))
      .catch(cb);
  };

  const getPublicPageInfo = (id, cb) => {
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
      .then((result) => {
        const json = result.toJSON();

        cb(null, {
          donationTotal: Number(json.donationTotal),
          backersCount: Number(json.backersCount)
        });
      })
      .catch(cb);
  };

  const getUsers = (req, res, next) => {

    const appendTier = (backers) => {
      backers = backers.map((backer) => {
        backer.tier = utils.getTier(backer, req.group.tiers);
        return backer;
      });
      return backers;
    }

    return getUsersQuery(req.group.id)
      .then(appendTier)
      .then(backers => res.send(backers))
      .catch(next);
  };

  const updateTransaction = (req, res, next) => {
    const whitelist = [
      'description',
      'link',
      'amount',
      'tags',
      'createdAt',
      'payoutMethod',
      'comment',
      'vat'
    ];

    whitelist.forEach((prop) => {
      if (req.required.transaction[prop]) {
        req.transaction[prop] = req.required.transaction[prop];
      }
    });

    req.transaction.updatedAt = new Date();

    req.transaction
      .save()
      .then(transaction => res.send(transaction.info))
      .catch(next);
  };

  /**
   * Get a group's transaction.
   */
  const getTransaction = (req, res) => res.json(req.transaction.info);

  /**
   * Get group's transactions.
   */
  const getTransactions = (req, res, next) => {
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
      .then((transactions) => {

        // Set headers for pagination.
        req.pagination.total = transactions.count;
        res.set({
          Link: utils.getLinkHeader(utils.getRequestedUrl(req), req.pagination)
        });

        res.send(_.pluck(transactions.rows, 'info'));
      })
      .catch(next);
  };

  /**
   * Delete a transaction.
   */
  const deleteTransaction = (req, res, next) => {
     var transaction = req.transaction;
     var group = req.group;
     var user = req.remoteUser || {};

     async.auto({

       deleteTransaction: (cb) => {
         transaction
           .destroy()
           .done(cb);
       },

       createActivity: ['deleteTransaction', (cb) => {
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

     }, (e) => {
       if (e) return next(e);
       res.send({success: true});
     });
  };

  /**
   * Create a transaction and add it to a group.
   */
  const createTransaction = (req, res, next) => {
    var transaction = req.required.transaction;
    var group = req.group;

    // Caller.
    var user = req.remoteUser || req.user || transaction.user || {};

    transactions._create({
      transaction,
      group,
      user
    }, (e, transactionCreated) => {
      if (e) return next(e);
      res.send(transactionCreated);
    });

  };

  /**
   * Delete a member.
   */
  const deleteUser = (req, res, next) => {
    var query = {
      where: {
        GroupId: req.group.id,
        UserId: req.user.id
      }
    };

    models
      .UserGroup
      .findOne(query)
      .then((usergroup) => {
        if (!usergroup) {
          throw (new errors.NotFound('The user is not part of the group yet.'));
        }

        return usergroup;
      })
      .then((usergroup) => usergroup.destroy())
      .then(() => {
        // Create activities.
        const remoteUser = (req.remoteUser && req.remoteUser.info) || (req.application && req.application.info);
        const activity = {
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
      .then(() => res.send({success: true}))
      .catch(next);
  };

  /**
   * Create a group.
   */
  const create = (req, res, next) => {
    Group
      .create(req.required.group)
      .then((group) => {

        async.series({
          createActivity: (cb) => {
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

          addUser: (cb) => {
            // Add caller to the group if `role` specified.
            const role = req.body.role;

            if (!role) {
              return cb();
            }

            const options = {
              role,
              remoteUser: req.remoteUser
            };

            addUserToGroup(group, req.remoteUser, options, cb);
          }
        }, (e) => {
          if (e) return next(e);
          res.send(group.info);
        });

      })
      .catch(next);
  };

  /**
   * Update.
   */
  const update = (req, res, next) => {
    const whitelist = [
      'name',
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
      'isPublic'
    ];

    whitelist.forEach(function(prop) {
      if (req.required.group[prop]) {
        req.group[prop] = req.required.group[prop];
      }
    });

    req.group.updatedAt = new Date();

    req.group
      .save()
      .then(function(group) {
        res.send(group.info);
      })
      .catch(next);
  };

  /**
   * Get group content.
   */
  const getOne = (req, res, next) => {
    async.auto({

      getBalance: getBalance.bind(this, req.group.id),
      getPublicPageInfo: getPublicPageInfo.bind(this, req.group.id),

      getActivities: (cb) => {
        if (!req.query.activities && !req.body.activities) {
          return cb();
        }

        const query = {
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
          .then((activities) => cb(null, activities.rows))
          .catch(cb);
      },

      getStripeAccount: (cb) =>  {
        req.group.getStripeAccount()
          .then((account) => cb(null, account))
          .catch(cb);
      },

      getConnectedAccount: (cb) => {
        req.group.getConnectedAccount()
          .then((account) => cb(null, account))
          .catch(cb);
      }

    }, (e, results) => {
      if (e) return next(e);

      const group = _.extend({}, req.group.info, {
        balance: results.getBalance,
        backersCount: results.getPublicPageInfo.backersCount,
        donationTotal: results.getPublicPageInfo.donationTotal
      });

      if (results.getActivities) {
        group.activities = results.getActivities;
      }

      if (results.getStripeAccount) {
        group.stripeAccount = _.pick(results.getStripeAccount, 'stripePublishableKey');
      }

      if (_.get(results, 'getConnectedAccount.provider') === 'paypal') {
        group.hasPaypal = true; // hack for the prototype, to refactor
      }

      res.send(group);
    });

  };

  /**
   * Add a user to a group.
   */
  const addUser = (req, res, next) =>{
    var options = {
      role: req.body.role || roles.BACKER,
      remoteUser: req.remoteUser
    };

    addUserToGroup(req.group, req.user, options, (e) => {
      if (e) return next(e);

      subscribeUserToGroupEvents(req.user, req.group, options.role);
      res.send({success: true});
    });
  };

  /**
   * Update a user.
   */
  const updateUser = (req, res, next) => {

    models
      .UserGroup
      .findOne({
        where: {
          GroupId: req.group.id,
          UserId: req.user.id
        }
      })
      .then((usergroup) => {
        if (!usergroup) {
          throw (new errors.NotFound('The user is not part of the group yet.'));
        }

        return usergroup;
      })
      .then((usergroup) => {
        if (req.body.role) {
          usergroup.role = req.body.role;
        }

        usergroup.updatedAt = new Date();

        return usergroup.save();
      })
      .then((usergroup) => {
        // Create activities.
        const remoteUser = (req.remoteUser && req.remoteUser.info) || (req.application && req.application.info);
        const activity = {
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
      .then((usergroup) => res.send(usergroup))
      .catch(next);
  };

  /**
   * Get leaderboard of collectives
   */
  const getLeaderboard = (req, res, next) => {

    return sequelize.query(`
      SELECT
        MAX(g.name) as name,
        COUNT(t.id) as "donationsCount",
        SUM(amount) as "totalAmount",
        MAX(g.currency) as currency,
        to_char(MAX(t."createdAt"), 'Month DD') as "latestDonation",
        MAX(g.slug) as slug,
        MAX(g.logo) as logo,
        ${utils.generateFXConversionSQL()}
      FROM "Transactions" t
      LEFT JOIN "Groups" g ON g.id = t."GroupId"
      WHERE t."createdAt" > current_date - INTERVAL '30' day
        AND t.amount > 0
        AND t."UserId"
        NOT IN (10,39,40,43,45,46)
      GROUP BY t."GroupId"
      ORDER BY "amountInUSD" DESC`,
    {
      type: sequelize.QueryTypes.SELECT
    })
    .then(groups => res.send(groups))
    .catch(next);
  };

  /**
   * Public methods.
   */
  return {
    create,
    update,
    getOne,
    addUser,
    updateUser,
    deleteUser,
    createTransaction,
    deleteTransaction,
    getTransaction,
    getTransactions,
    getBalance,
    getUsers,
    updateTransaction,
    getLeaderboard
  };

};
