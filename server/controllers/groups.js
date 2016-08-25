/**
 * Dependencies.
 */
import _ from 'lodash';
import async from 'async';
import utils from '../lib/utils';
import Promise from 'bluebird';
import moment from 'moment';
import roles from '../constants/roles';
import activities from '../constants/activities';
import emailLib from '../lib/email';
import githubLib from '../lib/github';
import queriesImport from '../lib/queries';

/**
 * Controller.
 */
export default function(app) {

  /**
   * Internal Dependencies.
   */
  const { errors } = app;
  const models = app.set('models');
  const { Activity } = models;
  const { Notification } = models;
  const { Group } = models;
  const { Transaction } = models;
  const { ConnectedAccount } = models;
  const { User } = models;
  const queries = queriesImport();


  const subscribeUserToGroupEvents = (user, group, role) => {
    if (role !== roles.HOST) return Promise.resolve();

    return Notification.create({
      UserId: user.id,
      GroupId: group.id,
      type: activities.GROUP_TRANSACTION_CREATED
    });
  };

  const subscribeUserToMailingList = (user, group, role) => {
    const lists = {};
    lists[roles.BACKER] = 'backers';
    lists[roles.MEMBER] = 'members';

    return Notification.create({
      UserId: user.id,
      GroupId: group.id,
      type: `mailinglist.${lists[role]}`
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

  const getUserData = (groupId, tiers) => {
    return queries.getUsersFromGroupWithTotalDonations(groupId)
      .then(backers => utils.appendTier(backers, tiers))
  };

  const getUsers = (req, res, next) => {
    let promise = getUserData(req.group.id, req.group.tiers);
    if (req.query.filter && req.query.filter === 'active') {
      const now = moment();
      promise = promise.filter(backer => now.diff(moment(backer.lastDonation), 'days') <= 90);
    }
    return promise
    .then(backers => res.send(backers))
    .catch(next)
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
    let where = {
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

    const query = _.merge({
      where,
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
     const { transaction } = req;
     const { group } = req;
     const user = req.remoteUser || {};

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
             transaction,
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
    const { transaction } = req.required;
    const { group } = req;

    // Caller.
    const user = req.remoteUser || req.user || transaction.user || {};
    return models.Transaction.createFromPayload({
        transaction,
        group,
        user
      })
      .then(t => res.send(t))
      .catch(next);
  };

  /**
   * Delete a member.
   */
  const deleteUser = (req, res, next) => {
    const query = {
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
    let group;
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
        const { role } = req.body;

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

    const { payload } = req.required;
    const { connectedAccountId } = req.jwtPayload;

    let creator, options, creatorConnectedAccount;
    const { group } = payload;
    const githubUser = payload.user;
    const contributors = payload.users;
    const creatorGithubUsername = payload.github_username;
    let dbGroup;

    ConnectedAccount
      .findOne({
        where: { id: connectedAccountId },
        include: { model: User }
      })
      .tap(ca => {
        creator = ca.User;
        creatorConnectedAccount = ca;
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
        return Group.create(Object.assign({}, group, {deletedAt: new Date(), isPublic: true}));
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
          if (contributor !== creatorGithubUsername && contributor !== creatorConnectedAccount.username) {
            const caAttr = {
              username: contributor,
              provider: 'github'
            };
            const userAttr = {
              avatar: `http://avatars.githubusercontent.com/${contributor}`
            };
            let connectedAccount, contributorUser;
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

    doUpdate(whitelist, req, res, next);
  };

  const updateSettings = (req, res, next) => {
    doUpdate(['settings'], req, res, next);
  };

  function doUpdate(whitelist, req, res, next) {
    whitelist.forEach((prop) => {
      if (req.required.group[prop]) {
        if (req.group[prop] && typeof req.group[prop] === 'object') {
          req.group[prop] = Object.assign(req.group[prop], req.required.group[prop]);
        } else {
          req.group[prop] = req.required.group[prop];
        }
      }
    });

    req.group.updatedAt = new Date();

    req.group
      .save()
      .then((group) => res.send(group.info))
      .catch(next);
  }

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
      req.group.getBackersCount(),
      req.group.getTwitterSettings(),
      req.group.getRelatedGroups(),
      req.group.getSuperCollectiveData()
      ])
    .then(values => {
      group.stripeAccount = values[0] && _.pick(values[0], 'stripePublishableKey');
      group.hasPaypal = values[1] && values[1].provider === 'paypal';
      group.balance = values[2];
      group.yearlyIncome = values[3];
      group.donationTotal = values[4];
      group.backersCount = values[5];
      group.settings = group.settings || {};
      group.settings.twitter = values[6];
      group.related = values[7];
      group.superCollectiveData = values[8];
      return group;
    })
    .then(group => res.send(group))
    .catch(next)
  };

  /**
   * Add a user to a group.
   */
  const addUser = (req, res, next) => {
    const options = {
      role: req.body.role || roles.BACKER,
      remoteUser: req.remoteUser
    };

    _addUserToGroup(req.group, req.user, options)
      .then(() => subscribeUserToGroupEvents(req.user, req.group, options.role))
      .then(() => subscribeUserToMailingList(req.user, req.group, options.role))
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
    return queries.getLeaderboard()
    .then(groups => res.send(groups))
    .catch(next);
  };

  /**
   * Get array of unique group tags
   */
  const getGroupTags = (req, res, next) => {
    return queries.getUniqueGroupTags()
    .then(tags => res.send(tags))
    .catch(next);
  };

  /**
   * Public methods.
   */
  return {
    create,
    createFromGithub,
    update,
    updateSettings,
    getOne,
    addUser,
    updateUser,
    deleteUser,
    createTransaction,
    deleteTransaction,
    getGroupTags,
    getTransaction,
    getTransactions,
    getUsers,
    updateTransaction,
    getLeaderboard
  };

};
