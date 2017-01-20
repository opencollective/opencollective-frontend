import _ from 'lodash';
import groupBy from 'lodash/collection/groupBy';
import async from 'async';
import userLib from '../lib/userlib';
import { generateURLSafeToken, getTier } from '../lib/utils';
import constants from '../constants/activities';
import roles from '../constants/roles';
import sequelize from 'sequelize';
import filter from 'lodash/collection/filter';
import values from 'lodash/object/values';
import emailLib from '../lib/email';
import queries from '../lib/queries';
import models from '../models';
import errors from '../lib/errors';
import moment from 'moment-timezone';

const {
  User,
  Activity,
  UserGroup
} = models;

const { Unauthorized } = errors;

/**
 *
 * Private methods.
 *
 */

const getUserGroups = (UserId) => {
  return UserGroup.findAll({
    where: {
      UserId
    }
  })
  .then((userGroups) => _.pluck(userGroups, 'info'));
};

const getGroupsFromUser = (req, options) => {
  // UserGroup has multiple entries for a user and group because
  // of the multiple roles. We will get the unique groups in-memory for now
  // because of the small number of groups.
  // Distinct queries are not supported by sequelize yet.
  return req.user
    .getGroups(options)
    .then(groups => _.uniq(groups, 'id'));
};

export const updatePaypalEmail = (req, res, next) => {
  const required = req.required || {};

  req.user.paypalEmail = required.paypalEmail;

  req.user.save()
  .then((user) => res.send(user.info))
  .catch(next);
};

export const updateAvatar = (req, res, next) => {
  const required = req.required || {};

  req.user.avatar = required.avatar;

  req.user.save()
  .then((user) => res.send(user.info))
  .catch(next);
};

/*
 * Update user info.
 * @PRE: user is logged in
 *       OR user has some missing info and has done a donation in the past 10mn
 *       (to allow updates from the public donation page)
 */
export const updateUser = (req, res, next) => {

  if (req.remoteUser && req.remoteUser.id === req.user.id) {
    return req.remoteUser.updateWhiteListedAttributes(req.required.user)
      .then(user => res.send(user.info))
      .catch(next)
  }

  if (!req.user.hasMissingInfo()) {
    return next(new errors.BadRequest('Can\'t update user that has already provided their information'));
  }

  return models.Donation.findOne({
    where: {
      UserId: req.user.id,
      updatedAt: {
        $gt: moment().add(-10, 'minutes').format()
      }
    },
    include: { model: User }
  })
  .tap(donation => {
    if (!donation) {
      return next(new Unauthorized("Can only modify user who had donation in last 10 min"));
    }
    return donation.User.updateWhiteListedAttributes(req.required.user)
      .then(user => res.send(user.info))
  })
  .catch(next);

};

/*
 * End point for social media avatar lookup from the public donation page
 */
export const getSocialMediaAvatars = (req, res, next) => {
  const { userData } = req.body;
  userData.email = req.user.email;
  userData.ip = req.ip;

  userLib.resolveUserAvatars(userData, (err, results) => {
    res.send(results);
  });
};

export const _create = user => userLib.fetchInfo(user)
  .then(user => User.create(user))
  .tap(dbUser => Activity.create({
    type: constants.USER_CREATED,
    UserId: dbUser.id,
    data: {user: dbUser.info}
  }));

export const updatePassword = (req, res, next) => {
  const { password, passwordConfirmation } = req.required;

  if (password !== passwordConfirmation) {
    return next(new errors.BadRequest('password and passwordConfirmation don\'t match'));
  }

  req.user.password = password;

  req.user.save()
    .then(() => res.send({success: true}))
    .catch(next);
};

export const forgotPassword = (req, res, next) => {
  const { email } = req.required;

  async.auto({
    getUser: (cb) => {
      User.findOne({
        where: { email }
      })
      .then(user => {
        if (!user) {
          return next(new errors.BadRequest(`User with email ${email} doesn't exist`));
        }

        cb(null, user);
      })
      .catch(cb);
    },

    generateToken: ['getUser', (cb, results) => {
      const user = results.getUser;
      const token = generateURLSafeToken(20);

      user.resetPasswordToken = token; // only place where we have token in plaintext
      user.resetPasswordSentAt = new Date();

      user.save()
      .then(() => cb(null, token))
      .catch(cb);
    }],

    sendEmailToUser: ['generateToken', (cb, results) => {
      const user = results.getUser;
      const { email } = results.getUser;
      const resetToken = results.generateToken;
      const resetUrl = user.generateResetUrl(resetToken);

      emailLib.send('user.forgot.password', email, {
        resetUrl,
        resetToken
      })
      .then(() => cb())
      .catch(cb);
    }]
  }, (err) => {
    if (err) return next(err);

    return res.send({ success: true });
  });
};

export const resetPassword = (req, res, next) => {
  const resetToken = req.params.reset_token;
  const id = User.decryptId(req.params.userid_enc);
  const { password }= req.required;
  const { passwordConfirmation } = req.required;

  if (password !== passwordConfirmation) {
    return next(new errors.BadRequest('password and passwordConfirmation don\'t match'));
  }

  async.auto({
    getUser: cb => {
      User.findById(id)
      .then(user => {
        if (!user) {
          return next(new errors.BadRequest(`User with id ${id} not found`));
        }

        cb(null, user);
      })
      .catch(cb);
    },

    checkResetToken: ['getUser', (cb, results) => {
      const user = results.getUser;
      user.checkResetToken(resetToken, cb);
    }],

    updateUser: ['checkResetToken', (cb, results) => {
      const user = results.getUser;

      user.resetPasswordTokenHash = null;
      user.resetPasswordSentAt = null;
      user.password = password;

      user.save()
        .then(() => cb())
        .catch(cb);
    }]

  }, err => {
    if (err) return next(err);

    return res.send({ success: true });
  });
};

/**
 *
 * Public methods.
 *
 */

/**
 * Create a user.
 */
export const create = (req, res, next) => {
  const { user } = req.required;

  _create(user)
    .tap(user => res.send(user.info))
    .catch(next);
};

/**
 * Get token.
 */
export const getToken = (req, res) => {
  res.send({
    access_token: req.user.jwt(),
    refresh_token: req.user.refresh_token
  });
};

/**
 * Show.
 */
export const show = (req, res, next) => {

  const userData = req.user.show;

  if (req.remoteUser && req.remoteUser.id === req.user.id) {
    req.user.getStripeAccount()
      .then((account) => {
        const response = Object.assign(userData, req.user.info, { stripeAccount: account });
        res.send(response);
      })
      .catch(next);
  } else if (req.query.profile) {
    const groupInfoArray = [];
    req.user.getGroups().map(group => {
      return Promise.all([
        group.getYearlyIncome(),
        queries.getUsersFromGroupWithTotalDonations(group.id).tap(backers => {
          backers.map(b => b.tier = getTier(b, group.tiers));
        })
      ])
      .then(results => {
        let groupInfo = group.info;
        groupInfo.yearlyIncome = results[0];
        const users = results[1];
        const user = users.filter(u => u.id === req.user.id)[0];
        const usersByRole = groupBy(users, 'role');
        const backers = usersByRole[roles.BACKER] || [];
        groupInfo.backersAndSponsorsCount = backers.length;
        groupInfo.sponsorsCount = filter(values(backers), {tier: 'sponsor'}).length;
        groupInfo.backersCount = groupInfo.backersAndSponsorsCount - groupInfo.sponsorsCount;
        groupInfo.myTotalDonations = user.totalDonations;
        groupInfo.myTier = user.tier;
        groupInfo = Object.assign(groupInfo, { role: group.UserGroup.role, createdAt: group.UserGroup.createdAt });
        groupInfoArray.push(groupInfo);
        return group;
      })
    })
    .then(groups => UserGroup.findAll({
      where: { GroupId: { $in: groups.map(g => g.id) } },
      attributes: ['GroupId', [ sequelize.fn('count', sequelize.col('GroupId')), 'members' ]],
      group: ['GroupId']
    }))
    .tap(counts => {
      const membersByGroupId = {};
      counts.map(g => {
        membersByGroupId[parseInt(g.GroupId,10)] = parseInt(g.dataValues.members, 10);
      });
      userData.groups = groupInfoArray.map(g => Object.assign(g, { members: membersByGroupId[parseInt(g.id, 10)] }));
      res.send(userData);
    })
    .catch(next);
  } else {
    res.send(userData);
  }
};

/**
 * Get a user's groups.
 */
export const getGroups = (req, res, next) => {
  // Follows json api spec http://jsonapi.org/format/#fetching-includes
  const { include } = req.query;
  const withRoles = _.contains(include, 'usergroup.role');
  const options = {
    include: []
  };

  let groupObjects; // stores sequelize objects
  const groupData = []; // stores data to return

  return getGroupsFromUser(req, options)
  .tap(groups => groupObjects = groups)
  .then(groups => groups.map(group => groupData.push(group.info)))
  .then(() => groupObjects.map(groupObject => {
    const group = _.find(groupData, {id: groupObject.id})
    return groupObject.getBalance()
      .then(balance => _.extend(group, { balance }))
  }))
  .then(() => {
    if (withRoles) {
      return getUserGroups(req.user.id)
        .then(userGroups => groupData.map(group => {
          const userGroup = _.find(userGroups, { GroupId: group.id }) || {};
          return _.extend(group, { role: userGroup.role });
        }))
    } else {
      return null;
    }
  })
  .then(() => res.send(groupData))
  .catch(next)
};

/**
 * For the case when a user has submitted an expired token,
 * we can automatically detect the email address and send a refreshed token.
 */
export const refreshTokenByEmail = (req, res, next) => {
  if (!req.jwtPayload || !req.remoteUser) {
    return next(new Unauthorized('Invalid payload'));
  }

  let redirect;
  if (req.body.redirect) {
    ({ redirect } = req.body);
  } else {
    redirect = '/';
  }
  const user = req.remoteUser;

  return emailLib.send('user.new.token', req.remoteUser.email, {
    loginLink: user.generateLoginLink(redirect)
  })
  .then(() => res.send({ success: true }))
  .catch(next);
};

/**
 * Send an email with the new token
 */
export const sendNewTokenByEmail = (req, res, next) => {
  const redirect = req.body.redirect || '/';
  return User.findOne({
    where: {
      email: req.required.email
    }
  })
  .then((user) => {
    // If you don't find a user, proceed without error
    // Otherwise, we can leak email addresses
    if (user) {
      return emailLib.send('user.new.token', req.body.email, {
        loginLink: user.generateLoginLink(redirect)
      });
    }
    return null;
  })
  .then(() => res.send({ success: true }))
  .catch(next);
};
