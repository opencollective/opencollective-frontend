/**
 * Dependencies.
 */
import _ from 'lodash';
import async from 'async';
import {appendTier, defaultHostId, getLinkHeader, getRequestedUrl} from '../lib/utils';
import Promise from 'bluebird';
import roles from '../constants/roles';
import activities from '../constants/activities';
import emailLib from '../lib/email';
import fetchGithubUser from '../lib/github';
import queries from '../lib/queries';
import models from '../models';
import errors from '../lib/errors';

const {
  Activity,
  Notification,
  Collective,
  Transaction,
  ConnectedAccount,
  User,
  Donation
} = models;

const _addUserToCollective = (collective, user, options) => {

  const checkIfCollectiveHasHost = () => {
    if (options.role !== roles.HOST) {
      return Promise.resolve();
    }

    return collective.hasHost()
    .then(hasHost => {
      if (hasHost) {
        return Promise.reject(new errors.BadRequest('Collective already has a host'));
      }
      return Promise.resolve();
    })
  };

  const addUserToCollective = () => collective.addUserWithRole(user, options.role);

  const createActivity = () => Activity.create({
    type: 'collective.user.added',
    CollectiveId: collective.id,
    data: {
      collective: collective.info,
      creator: options.remoteUser.info,
      user: user.info,
      role: options.role
    }
  });

  return checkIfCollectiveHasHost()
    .then(addUserToCollective)
    .then(createActivity);
};

const _getUsersData = (collective) => {
  return collective.getSuperCollectiveCollectivesIds()
    .then(ids => queries.getUsersFromCollectiveWithTotalDonations(ids))
    .then(users => appendTier(collective, users))
};

export const getUsers = (req, res, next) => {
  let promise = _getUsersData(req.collective);

  if (req.query.filter && req.query.filter === 'active') {
    promise = promise.filter(user => user.dataValues.role !== 'BACKER' || req.collective.isBackerActive(user));
  }

  return promise
    .then(users => {
      return users.map(user => {
        const u = {...user.info, role: user.dataValues.role, tier: user.tier && user.tier.info};
        if (!req.canEditCollective) {
          delete u.email;
        }
        return u;
      });
    })
    .then(users => res.send(users))
    .catch(next)
};

export const getUsersWithEmail = (req, res, next) => {
  let promise = _getUsersData(req.collective);
  if (req.query.filter && req.query.filter === 'active') {
    promise = promise.filter(backer => req.collective.isBackerActive(backer));
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
 * Get collective's transactions.
 */
export const getTransactions = (req, res, next) => {
  const where = {
    CollectiveId: req.collective.id
  };

  if (req.query.donation || req.query.type === 'donations') {
    where.amount = {
      $gt: 0
    };
  } else if (req.query.expense || req.query.type === 'expenses') {
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
   const { collective } = req;
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
         type: 'collective.transaction.deleted',
         UserId: user.id,
         CollectiveId: collective.id,
         data: {
           collective: collective.info,
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
 * Create a transaction and add it to a collective.
 */
export const createTransaction = (req, res, next) => {
  const { transaction } = req.required;
  const { collective } = req;

  // Caller.
  const user = req.remoteUser || req.user || transaction.user || {};
  return models.Transaction.createFromPayload({
      transaction,
      collective,
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
      CollectiveId: req.collective.id,
      UserId: req.user.id
    }
  };

  models
    .Role
    .findOne(query)
    .then((Role) => {
      if (!Role) {
        throw (new errors.NotFound('The user is not part of the collective yet.'));
      }

      return Role;
    })
    .then((Role) => Role.destroy())
    .tap(() => {
      // Create activities.
      const remoteUser = (req.remoteUser && req.remoteUser.info);
      const activity = {
        type: 'collective.user.deleted',
        CollectiveId: req.collective.id,
        data: {
          collective: req.collective.info,
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
 * Create a collective.
 */
export const create = (req, res, next) => {
  const { collective } = req.required;
  const { users = [] } = collective;
  let createdCollective, creator, host;

  if (users.length < 1) throw new errors.ValidationFailed('Need at least one user to create a collective');

  const sendConfirmationEmail = (user, collective) => {
    const data = {
      collective,
      confirmation_url: user.generateLoginLink(`/${collective.slug}`)
    }
    emailLib.send('collective.confirm', user.email, data);
  };

  // Default tiers
  collective.tiers = collective.tiers || [
    {"type": "TIER", "name":"backer", "amount": 1000, "interval":"month", currency: collective.currency || "USD"},
    {"type": "TIER", "name":"sponsor", "amount": 10000, "interval":"month", currency: collective.currency || "USD"}
  ];

  return Collective
    .create(collective)
    .tap(g => createdCollective = g)
    .tap(g => {
      return Promise.each(users, user => {
        if (user.email) {
          return User.findOne({where: { email: user.email.toLowerCase() }})
          .then(u => u || User.create(user))
          .then(u => {
            if (!creator) {
              creator = u;
            }
            if (user.role === roles.HOST && !collective.HostId) {
              collective.HostId = u.id;
              return;
            } else {
              return _addUserToCollective(g, u, {role: user.role, remoteUser: creator})
            }
          })
          .then(() => createdCollective.update({ LastEditedByUserId: creator.id }))
        } else {
          return null;
        }
      })
    })
    .tap(g => {
      return User.findOne({ where: { id: collective.HostId || defaultHostId() }}).tap(h => {
        host = h;
        _addUserToCollective(g, host, {role: roles.HOST, remoteUser: creator})
        return null;
      })
    })
    .then(() => {
      if (collective.tiers) {
        return models.Tier.createMany(collective.tiers, { CollectiveId: createdCollective.id })
      }
      return null;
    })
    .then(() => Activity.create({
      type: activities.COLLECTIVE_CREATED,
      UserId: creator.id,
      CollectiveId: createdCollective.id,
      data: {
        collective: createdCollective.info,
        host: host && host.info,
        user: creator.info
      }
    }))
    .then(() => sendConfirmationEmail(creator, createdCollective))
    .then(() => res.send(createdCollective.info))
    .catch(next);
};

/*
 * Creates a collective from Github
 */
export const createFromGithub = (req, res, next) => {

  const { payload } = req.required;
  const { connectedAccountId } = req.jwtPayload;

  let creator, options, creatorConnectedAccount;
  const { collective } = payload;
  const githubUser = payload.user;
  const contributors = payload.users;
  const creatorGithubUsername = payload.github_username;
  let dbCollective;

  // Default tiers
  collective.tiers = collective.tiers || [
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
    .then(() => Collective.findOne({where: {slug: collective.slug.toLowerCase()}}))
    .then(existingCollective => {
      if (existingCollective) {
        collective.slug = `${collective.slug}+${Math.floor((Math.random() * 1000) + 1)}`;
      }
      return Collective.create(Object.assign({}, collective, {LastEditedByUserId: creator.id}));
    })
    .tap(g => dbCollective = g)
    .then(() => _addUserToCollective(dbCollective, creator, options))
    .then(() => User.findById(defaultHostId())) // make sure the host exists
    .tap(host => {
      if (host) {
        return _addUserToCollective(dbCollective, host, {role: roles.HOST, remoteUser: creator})
      } else {
        return null;
      }
    })
    .tap((host) => Activity.create({
      type: activities.COLLECTIVE_CREATED,
        UserId: creator.id,
        CollectiveId: dbCollective.id,
        data: {
          collective: dbCollective.info,
          host: host.info,
          user: creator.info
        }
      }))
    .then(() => Promise.map(contributors, contributor => {
      // since we added the creator above with an email, avoid double adding
      if (contributor !== creatorGithubUsername && contributor !== creatorConnectedAccount.username) {
        const caAttr = {
          username: contributor,
          provider: 'github'
        };
        const userAttr = {
          image: `https://images.githubusercontent.com/${contributor}`
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
          .then(user => user || User.create(Object.assign(userAttr)))
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
          .then(() => _addUserToCollective(dbCollective, contributorUser, options));
      } else {
        return Promise.resolve();
      }
    }))
    .then(() => {
      const data = {
        firstName: creator.firstName,
        lastName: creator.lastName,
        collective: dbCollective.info
      };
      return emailLib.send('github.signup', creator.email, data);
    })
    .tap(() => res.send(dbCollective.info))
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
    'currency',
    'image',
    'backgroundImage',
    'isActive'
  ];

  const updatedCollectiveAttrs = _.pick(req.required.collective, whitelist);

  updatedCollectiveAttrs.LastEditedByUserId = req.remoteUser.id;

  // Need to handle settings separately, since it's an object
  if (req.required.collective.settings) {
    updatedCollectiveAttrs.settings = Object.assign(req.collective.settings || {}, req.required.collective.settings);
  }

  return req.collective.update(updatedCollectiveAttrs)
    .then(collective => res.send(collective.info))
    .catch(next)
};

export const updateSettings = (req, res, next) => {
  putThankDonationOptInIntoNotifTable(req.collective.id, req.required.collective.settings)
    .then(() => doUpdate(['settings'], req, res, next))
    .catch(next);
};

function putThankDonationOptInIntoNotifTable(CollectiveId, collectiveSettings) {
  const twitterSettings = collectiveSettings && collectiveSettings.twitter;
  const attrs = {
    channel: 'twitter',
    type: activities.COLLECTIVE_TRANSACTION_CREATED,
    CollectiveId
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
    if (req.required.collective[prop]) {
      if (req.collective[prop] && typeof req.collective[prop] === 'object') {
        req.collective[prop] = Object.assign(req.collective[prop], req.required.collective[prop]);
      } else {
        req.collective[prop] = req.required.collective[prop];
      }
    }
  });

  req.collective.updatedAt = new Date();

  req.collective
    .save()
    .then((collective) => res.send(collective.info))
    .catch(next);
}

/**
 * Get collective content.
 */
export const getOne = (req, res, next) => {
  const collective = req.collective.info;

  const aggregate = (array, attribute) => {
    return array.map(d => d[attribute]).reduce((a, b) => a + b, 0);
  };

  const getRelatedCollectives = () => {
    // don't fetch related collectives for supercollectives for now
    if (req.collective.isSupercollective) return Promise.resolve();
    else return req.collective.getRelatedCollectives();
  }

  Promise.all([
    req.collective.getStripeAccount(),
    req.collective.getConnectedAccount(),
    req.collective.getBalance(),
    req.collective.getYearlyIncome(),
    req.collective.getTotalDonations(),
    req.collective.getBackersCount(),
    req.collective.getTwitterSettings(),
    getRelatedCollectives(),
    req.collective.getSuperCollectiveData(),
    req.collective.getHost()
    ])
  .then(values => {
    collective.stripeAccount = values[0] && _.pick(values[0], 'stripePublishableKey');
    collective.hasPaypal = values[1] && values[1].provider === 'paypal';
    collective.balance = values[2];
    collective.yearlyIncome = values[3];
    collective.donationTotal = values[4];
    collective.backersCount = values[5];
    collective.contributorsCount = (collective.data && collective.data.githubContributors) ? Object.keys(collective.data.githubContributors).length : 0;
    collective.settings = collective.settings || {};
    collective.settings.twitter = values[6];
    collective.related = values[7];
    collective.superCollectiveData = values[8];
    collective.host = values[9] && values[9].info;
    if (collective.superCollectiveData) {
      collective.collectivesCount = collective.superCollectiveData.length;
      collective.contributorsCount += aggregate(collective.superCollectiveData, 'contributorsCount');
      collective.yearlyIncome += aggregate(collective.superCollectiveData, 'yearlyIncome');
      collective.backersCount += aggregate(collective.superCollectiveData, 'backersCount');
      collective.donationTotal += aggregate(collective.superCollectiveData, 'donationTotal');
    }
    return collective;
  })
  .then(collective => res.send(collective))
  .catch(next)
};

/**
 * Add a user to a collective.
 */
export const addUser = (req, res, next) => {
  const options = {
    role: req.body.role || roles.BACKER,
    remoteUser: req.remoteUser
  };

  _addUserToCollective(req.collective, req.user, options)
    .tap(() => res.send({success: true}))
    .catch(next);
};

/**
 * Update a user.
 */
export const updateUser = (req, res, next) => {

  models
    .Role
    .findOne({
      where: {
        CollectiveId: req.collective.id,
        UserId: req.user.id
      }
    })
    .then((Role) => {
      if (!Role) {
        throw (new errors.NotFound('The user is not part of the collective yet.'));
      }

      return Role;
    })
    .then((Role) => {
      if (req.body.role) {
        Role.role = req.body.role;
      }

      Role.updatedAt = new Date();

      return Role.save();
    })
    .then((Role) => {
      // Create activities.
      const remoteUser = (req.remoteUser && req.remoteUser.info);
      const activity = {
        type: 'collective.user.updated',
        CollectiveId: req.collective.id,
        data: {
          collective: req.collective.info,
          user: remoteUser,
          target: req.user.info,
          Role: Role.info
        }
      };
      Activity.create(_.extend({UserId: req.user.id}, activity));
      if (req.remoteUser && req.user.id !== req.remoteUser.id)
        Activity.create(_.extend({UserId: req.remoteUser.id}, activity));

      return Role;
    })
    .then((Role) => res.send(Role))
    .catch(next);
};

/**
 * Get array of unique collective tags
 */
export const getCollectiveTags = (req, res, next) => {
  return queries.getUniqueCollectiveTags()
  .then(tags => res.send(tags))
  .catch(next);
};
