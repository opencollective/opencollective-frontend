/**
 * Dependencies.
 */
const _ = require('lodash');
const async = require('async');
const utils = require('../lib/utils');
const Promise = require('bluebird');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  const errors = app.errors;
  const models = app.set('models');
  const sequelize = models.sequelize;
  const Activity = models.Activity;
  const Notification = models.Notification;
  const Group = models.Group;
  const Transaction = models.Transaction;
  const ConnectedAccount = models.ConnectedAccount;
  const User = models.User;
  const transactions = require('../controllers/transactions')(app);
  const roles = require('../constants/roles');
  const activities = require('../constants/activities');
  const emailLib = require('../lib/email')(app);
  const githubLib = require('../lib/github');

  /**
   * Returns all the users of a group with their `totalDonations` and `role` (HOST/MEMBER/BACKER)
   */
  const getUsersQuery = (GroupId) => {
    return sequelize.query(`
      WITH total_donations AS (
        SELECT
          max("UserId") as "UserId",
          SUM(amount/100) as amount
        FROM "Donations" d
        WHERE d."GroupId" = :GroupId AND d.amount >= 0
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
        td.amount as "totalDonations"
      FROM "UserGroups" ug
      LEFT JOIN "Users" u ON u.id = ug."UserId"
      LEFT JOIN total_donations td ON td."UserId" = ug."UserId"
      WHERE ug."GroupId" = :GroupId
      AND ug."deletedAt" IS NULL
      ORDER BY "totalDonations" DESC, ug."createdAt" ASC
    `, {
      replacements: { GroupId },
      type: sequelize.QueryTypes.SELECT
    });
  };

  const subscribeUserToGroupEvents = (user, group, role) => {
    if(role !== roles.HOST) return Promise.resolve();

    return Notification.create({
      UserId: user.id,
      GroupId: group.id,
      type: activities.GROUP_TRANSACTION_CREATED
    });
  };

  const _addUserToGroup = (group, user, options) => {
    const checkIfGroupHasHost = () => {
      if (options.role !== roles.HOST) {
        return Promise.resolve();
      }

      return group.hasHost().then(hasHost => {
        if (hasHost) {
          return Promise.reject(new errors.BadRequest('Group already has a host'));
        }
        return Promise.resolve();
      })
    };

    const addUserToGroup = () => group.addUserWithRole(user, options.role);

    const createActivity = () => Activity.create({
      type: 'group.user.added',
      GroupId: group.id,
      data: {
        group: group.info,
        creator: options.remoteUser.info,
        user: user.info,
        role: options.role
      }
    });

    return checkIfGroupHasHost()
      .then(addUserToGroup)
      .then(createActivity);
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

    if (req.query.exclude) {
      where.$or = [ { type: { $ne: req.query.exclude } }, { type: { $eq: null } } ];
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
           .then(() => cb())
           .catch(cb);
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
         })
         .then(activity => cb(null, activity))
         .catch(cb);
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
      .tap(() => {
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
        return Activity.create(_.extend({UserId: req.user.id}, activity))
          .then(a => {
            if (req.remoteUser && req.user.id !== req.remoteUser.id) {
              return Activity.create(_.extend({UserId: req.remoteUser.id}, activity));
            }
            return a;
          });
      })
      .then(() => res.send({success: true}))
      .catch(next);
  };

  /**
   * Create a group.
   */
  const create = (req, res, next) => {
    var group;
    Group
      .create(req.required.group)
      .tap(g => group = g)
      .then(() => Activity.create({
        type: activities.GROUP_CREATED,
        UserId: req.remoteUser.id,
        GroupId: group.id,
        data: {
          group: group.info,
          user: req.remoteUser.info
        }
      }))
      .then(activity => {
        // Add caller to the group if `role` specified.
        const role = req.body.role;

        if (!role) {
          return activity;
        }

        const options = {
          role,
          remoteUser: req.remoteUser
        };

        return _addUserToGroup(group, req.remoteUser, options);
      })
      .tap(() => res.send(group.info))
      .catch(next);
  };

  /*
   * Creates a group from Github
   */
  const createFromGithub = (req, res, next) => {

    var payload = req.required.payload;
    const connectedAccountId = req.jwtPayload.connectedAccountId;

    var creator, options;
    const group = payload.group;
    const githubUser = payload.user;
    const contributors = payload.users;
    const creatorGithubUsername = payload.github_username;
    var dbGroup;

    ConnectedAccount
      .findOne({
        where: { id: connectedAccountId },
        include: { model: User }
      })
      .tap(ca => {
        creator = ca.User;
        options = {
          role: roles.MEMBER,
          remoteUser: creator
        };
      })
      .tap(() => {
        if (githubUser) {
          creator.website = githubUser.blog;
          creator.name = githubUser.name;
          return creator.save();
        }
      })
      .then(() => Group.findOne({where: {slug: group.slug.toLowerCase()}}))
      .then(existingGroup => {
        if (existingGroup) {
          group.slug = `${group.slug}+${Math.floor((Math.random() * 1000) + 1)}`;
        }
        return Group.create(group)
      })
      .tap(g => dbGroup = g)
      .tap(() => Activity.create({
        type: activities.GROUP_CREATED,
          UserId: creator.id,
          GroupId: dbGroup.id,
          data: {
            group: dbGroup.info,
            user: creator.info
          }
        }))
        .then(() => _addUserToGroup(dbGroup, creator, options))
        .then(() => User.findById(utils.defaultHostId())) // make sure the host exists
        .then(hostUser => {
          if (hostUser) {
            return _addUserToGroup(dbGroup, hostUser, {role: roles.HOST, remoteUser: creator})
          } else {
            return null;
          }
        })
        .then(() => Promise.map(contributors, contributor => {
          // since we added the creator above with an email, avoid double adding
          if (contributor !== creatorGithubUsername) {
            const caAttr = {
              username: contributor,
              provider: 'github'
            };
            var userAttr = {
              avatar: `http://avatars.githubusercontent.com/${contributor}`
            };
            var connectedAccount, contributorUser;
            return ConnectedAccount.findOne({where: caAttr})
              .then(ca => ca || ConnectedAccount.create(caAttr))
              .then(ca => {
                connectedAccount = ca;
                if (!ca.UserId) {
                  return User.findOne({where: userAttr});
                } else {
                  return ca.getUser();
                }
              })
              .then(user => user || User.create(userAttr))
              .then(user => contributorUser = user)
              .then(() => githubLib.fetchUser(contributor))
              .tap(json => {
                contributorUser.name = json.name;
                contributorUser.website = json.blog;
                contributorUser.email = json.email;
                return contributorUser.save();
              })
              .then(() => contributorUser.addConnectedAccount(connectedAccount))
              .then(() => _addUserToGroup(dbGroup, contributorUser, options));
          } else {
            return Promise.resolve();
          }
        }))
        .then(() => {
          const data = {
            name: creator.name,
            group: dbGroup.info
          };
          return emailLib.send('github.signup', creator.email, data);
        })
        .tap(() => res.send(dbGroup.info))
        .catch(next);
  };

  /**
   * Update.
   */
  const update = (req, res, next) => {
    const whitelist = [
      'name',
      'mission',
      'description',
      'longDescription',
      'whyJoin',
      'settings',
      'currency',
      'logo',
      'video',
      'image',
      'backgroundImage',
      'expensePolicy',
      'isPublic'
    ];

    whitelist.forEach((prop) => {
      if (req.required.group[prop]) {
        req.group[prop] = req.required.group[prop];
      }
    });

    req.group.updatedAt = new Date();

    req.group
      .save()
      .then((group) => res.send(group.info))
      .catch(next);
  };

  /**
   * Get group content.
   */
  const getOne = (req, res, next) => {
    const group = req.group.info;

    Promise.all([
      req.group.getStripeAccount(),
      req.group.getConnectedAccount(),
      req.group.getBalance(),
      req.group.getYearlyIncome(),
      req.group.getTotalDonations(),
      req.group.getBackersCount()
      ])
    .then(values => {
      group.stripeAccount = values[0] && _.pick(values[0], 'stripePublishableKey');
      group.hasPaypal = values[1] && values[1].provider === 'paypal';
      group.balance = values[2];
      group.yearlyIncome = values[3];
      group.donationTotal = values[4];
      group.backersCount = values[5];
      return group;
    })
    .then(group => res.send(group))
    .catch(next)
  };

  /**
   * Add a user to a group.
   */
  const addUser = (req, res, next) => {
    var options = {
      role: req.body.role || roles.BACKER,
      remoteUser: req.remoteUser
    };

    _addUserToGroup(req.group, req.user, options)
      .then(() => subscribeUserToGroupEvents(req.user, req.group, options.role))
      .tap(() => res.send({success: true}))
      .catch(next);
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
    createFromGithub,
    update,
    getOne,
    addUser,
    updateUser,
    deleteUser,
    createTransaction,
    deleteTransaction,
    getTransaction,
    getTransactions,
    getUsers,
    updateTransaction,
    getLeaderboard
  };

};
