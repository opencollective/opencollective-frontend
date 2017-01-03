/**
 * Dependencies.
 */
import _ from 'lodash';
import async from 'async';
import {appendTier, defaultHostId, getLinkHeader, getRequestedUrl, isBackerActive} from '../lib/utils';
import Promise from 'bluebird';
import roles from '../constants/roles';
import activities from '../constants/activities';
import emailLib from '../lib/email';
import fetchGithubUser from '../lib/github';
import queries from '../lib/queries';
import models from '../models';
import errors from '../lib/errors';
import * as auth from '../middleware/security/auth';

const {
  Activity,
  Notification,
  Group,
  Transaction,
  ConnectedAccount,
  User,
  Donation
} = models;

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

const _getUsersData = (group) => {
  return group.getSuperCollectiveGroupsIds()
    .then(ids => queries.getUsersFromGroupWithTotalDonations(ids))
    .then(backers => appendTier(backers, group.tiers))
};

export const getUsers = (req, res, next) => {

  auth.canEditGroup(req, res, (e, canEditGroup) => {
    let promise = _getUsersData(req.group);

    if (req.query.filter && req.query.filter === 'active') {
      promise = promise.filter(backer => isBackerActive(backer, req.group.tiers));
    }

    return promise
    .then(backers => {
      if (canEditGroup) return backers;
      else return backers.map(b => {
        delete b.email;
        return b;
      });
    })
    .then(backers => res.send(backers))
    .catch(next)
  });
};

export const getUsersWithEmail = (req, res, next) => {
  let promise = _getUsersData(req.group);
  if (req.query.filter && req.query.filter === 'active') {
    promise = promise.filter(backer => isBackerActive(backer, req.group.tiers));
  }
  return promise
  .then(backers => res.send(backers))
  .catch(next)
};

export const updateTransaction = (req, res, next) => {
  const whitelist = [
    'description',
    'link',
    'amount',
    'tags',
    'createdAt',
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
 * Get group's transactions.
 */
export const getTransactions = (req, res, next) => {
  const where = {
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

  if (req.query.exclude) {
    where.$or = [ { type: { $ne: req.query.exclude } }, { type: { $eq: null } } ];
  }

  const query = _.merge({
    where,
    include: { model: Donation },
    order: [[req.sorting.key, req.sorting.dir]]
  }, req.pagination);

  Transaction
    .findAndCountAll(query)
    .then((transactions) => {

      // Set headers for pagination.
      req.pagination.total = transactions.count;
      res.set({
        Link: getLinkHeader(getRequestedUrl(req), req.pagination)
      });

      res.send(transactions.rows.map(transaction => Object.assign({}, transaction.info, {'description': (transaction.Donation && transaction.Donation.title) || transaction.description })));
    })
    .catch(next);
};

/**
 * Delete a transaction.
 */
export const deleteTransaction = (req, res, next) => {
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
export const createTransaction = (req, res, next) => {
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
export const deleteUser = (req, res, next) => {
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
      const remoteUser = (req.remoteUser && req.remoteUser.info);
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
export const create = (req, res, next) => {
  const { group } = req.required;
  const { users = [] } = group;
  let createdGroup, creator;

  if (users.length < 1) throw new errors.ValidationFailed('Need at least one user to create a group');

  const sendConfirmationEmail = (user, group) => {
    const data = {
      group,
      confirmation_url: user.generateLoginLink(`/${group.slug}`)
    }
    emailLib.send('group.created', user.email, data);
  };

  // Default tiers
  group.tiers = group.tiers || [
    {"name":"backer","range":[2,100000],"presets":[2,10,25],"interval":"monthly"},
    {"name":"sponsor","range":[100,500000],"presets":[100,250,500],"interval":"monthly"}
  ];

  return Group
    .create(group)
    .tap(g => createdGroup = g)
    .tap(g => {
      return Promise.map(users, user => {
        if (user.email) {
          return User.findOne({where: { email: user.email.toLowerCase() }})
          .then(u => u || User.create(user))
          .then(u => {
            if (!creator) {
              creator = u;
            }
            return _addUserToGroup(g, u, {role: user.role, remoteUser: creator})
          })
          .then(() => createdGroup.update({ lastEditedByUserId: creator.id }))
        } else {
          return null;
        }
      })
    })
    .tap(g => {
      // if there is a host id provided, we add the collective to the host
      if (group.HostId) {
        return User.findOne({ where: { id: group.HostId }}).tap(host => _addUserToGroup(g, host, {role: roles.HOST, remoteUser: creator}))
      }
    })
    .then(host => Activity.create({
      type: activities.GROUP_CREATED,
      UserId: creator.id,
      GroupId: host && host.id,
      data: {
        group: createdGroup.info,
        host: host && host.info,
        user: creator.info
      }
    }))
    .then(() => sendConfirmationEmail(creator, createdGroup))
    .then(() => res.send(createdGroup.info))
    .catch(next);
};

/*
 * Creates a group from Github
 */
export const createFromGithub = (req, res, next) => {

  const { payload } = req.required;
  const { connectedAccountId } = req.jwtPayload;

  let creator, options, creatorConnectedAccount;
  const { group } = payload;
  const githubUser = payload.user;
  const contributors = payload.users;
  const creatorGithubUsername = payload.github_username;
  let dbGroup;

  // Default tiers
  group.tiers = group.tiers || [
    {"name":"backer","range":[2,100000],"presets":[2,10,25],"interval":"monthly"},
    {"name":"sponsor","range":[100,500000],"presets":[100,250,500],"interval":"monthly"}
  ];

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
        if (githubUser.name) {
          const nameTokens = githubUser.name.split(' ');
          creator.firstName = nameTokens.shift();
          creator.lastName = nameTokens.join(' ');
        }
        creator.website = githubUser.blog;
        return creator.save();
      }
    })
    .then(() => Group.findOne({where: {slug: group.slug.toLowerCase()}}))
    .then(existingGroup => {
      if (existingGroup) {
        group.slug = `${group.slug}+${Math.floor((Math.random() * 1000) + 1)}`;
      }
      return Group.create(Object.assign({}, group, {deletedAt: new Date(), isPublic: true, lastEditedByUserId: creator.id}));
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
      .then(() => User.findById(defaultHostId())) // make sure the host exists
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
            .then(() => fetchGithubUser(contributor))
            .tap(json => {
              if (json.name) {
                const nameTokens = json.name.split(' ');
                contributorUser.firstName = nameTokens.shift();
                contributorUser.lastName = nameTokens.join(' ');
              }
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
          firstName: creator.firstName,
          lastName: creator.lastName,
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
export const update = (req, res, next) => {
  const whitelist = [
    'name',
    'mission',
    'description',
    'longDescription',
    'whyJoin',
    'currency',
    'logo',
    'video',
    'image',
    'backgroundImage',
    'expensePolicy',
    'isPublic'
  ];

  const updatedGroupAttrs = _.pick(req.required.group, whitelist);

  updatedGroupAttrs.lastEditedByUserId = req.remoteUser.id;

  // Need to handle settings separately, since it's an object
  if (req.required.group.settings) {
    updatedGroupAttrs.settings = Object.assign(req.group.settings || {}, req.required.group.settings);
  }

  return req.group.update(updatedGroupAttrs)
    .then(group => res.send(group.info))
    .catch(next)
};

export const updateSettings = (req, res, next) => {
  putThankDonationOptInIntoNotifTable(req.group.id, req.required.group.settings)
    .then(() => doUpdate(['settings'], req, res, next))
    .catch(next);
};

function putThankDonationOptInIntoNotifTable(GroupId, groupSettings) {
  const twitterSettings = groupSettings && groupSettings.twitter;
  const attrs = {
    channel: 'twitter',
    type: activities.GROUP_TRANSACTION_CREATED,
    GroupId
  };

  const thankDonationEnabled = twitterSettings.thankDonationEnabled;
  delete twitterSettings.thankDonationEnabled;
  if (thankDonationEnabled) {
    return Notification.findOne({where: attrs})
      .then(n => n || Notification.create(Object.assign({active:true}, attrs)));
  } else {
    return Notification.findOne({where: attrs})
      .then(n => n && n.destroy());
  }
}

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
export const getOne = (req, res, next) => {
  const group = req.group.info;

  const aggregate = (array, attribute) => {
    return array.map(d => d[attribute]).reduce((a, b) => a + b);
  };

  const getRelatedGroups = () => {
    // don't fetch related groups for supercollectives for now
    if (req.group.isSupercollective) return Promise.resolve();
    else return req.group.getRelatedGroups();
  }

  Promise.all([
    req.group.getStripeAccount(),
    req.group.getConnectedAccount(),
    req.group.getBalance(),
    req.group.getYearlyIncome(),
    req.group.getTotalDonations(),
    req.group.getBackersCount(),
    req.group.getTwitterSettings(),
    getRelatedGroups(),
    req.group.getSuperCollectiveData()
    ])
  .then(values => {
    group.stripeAccount = values[0] && _.pick(values[0], 'stripePublishableKey');
    group.hasPaypal = values[1] && values[1].provider === 'paypal';
    group.balance = values[2];
    group.yearlyIncome = values[3];
    group.donationTotal = values[4];
    group.backersCount = values[5];
    group.contributorsCount = (group.data && group.data.githubContributors) ? Object.keys(group.data.githubContributors).length : 0;
    group.settings = group.settings || {};
    group.settings.twitter = values[6];
    group.related = values[7];
    group.superCollectiveData = values[8];
    if (group.superCollectiveData) {
      group.collectivesCount = group.superCollectiveData.length;
      group.contributorsCount += aggregate(group.superCollectiveData, 'contributorsCount');
      group.yearlyIncome += aggregate(group.superCollectiveData, 'yearlyIncome');
      group.backersCount += aggregate(group.superCollectiveData, 'backersCount');
      group.donationTotal += aggregate(group.superCollectiveData, 'donationTotal');
    }
    return group;
  })
  .then(group => res.send(group))
  .catch(next)
};

/**
 * Add a user to a group.
 */
export const addUser = (req, res, next) => {
  const options = {
    role: req.body.role || roles.BACKER,
    remoteUser: req.remoteUser
  };

  _addUserToGroup(req.group, req.user, options)
    .tap(() => res.send({success: true}))
    .catch(next);
};

/**
 * Update a user.
 */
export const updateUser = (req, res, next) => {

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
      const remoteUser = (req.remoteUser && req.remoteUser.info);
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
 * Get array of unique group tags
 */
export const getGroupTags = (req, res, next) => {
  return queries.getUniqueGroupTags()
  .then(tags => res.send(tags))
  .catch(next);
};
