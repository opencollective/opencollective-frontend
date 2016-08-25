/**
 * Dependencies.
 */
import _ from 'lodash';
import groupBy from 'lodash/collection/groupBy';
import async from 'async';
import userlib from '../lib/userlib';
import { generateURLSafeToken, getTier } from '../lib/utils';
import imageUrlToAmazonUrl from '../lib/imageUrlToAmazonUrl';
import constants from '../constants/activities';
import roles from '../constants/roles';
import sequelize from 'sequelize';
import filter from 'lodash/collection/filter';
import values from 'lodash/object/values';
import emailLib from '../lib/email';
import queriesImport from '../lib/queries';

/**
 * Controller.
 */
export default (app) => {

  /**
   * Internal Dependencies.
   */
  const models = app.set('models');
  const { User } = models;
  const { Activity } = models;
  const { UserGroup } = models;
  const { errors } = app;
  const queries = queriesImport();
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

  const updatePaypalEmail = (req, res, next) => {
    const required = req.required || {};

    req.user.paypalEmail = required.paypalEmail;

    req.user.save()
    .then((user) => res.send(user.info))
    .catch(next);
  };

  const updateAvatar = (req, res, next) => {
    const required = req.required || {};

    req.user.avatar = required.avatar;

    req.user.save()
    .then((user) => res.send(user.info))
    .catch(next);
  };

  /*
   * End point to update user info from the public donation page
   * Only works if password is null, as an extra precaution
   */

  const updateUserWithoutLoggedIn = (req, res, next) => {
    if (req.user.hasPassword()) {
      return next(new errors.BadRequest('Can\'t update user with password from this route'));
    }

    async.auto({
      updateFields: (cb) => {
        ['name',
         'twitterHandle',
         'website',
         'avatar'
         ].forEach((prop) => {
          if (req.required.user[prop]) {
            req.user[prop] = req.required.user[prop];
          }
        });

        cb(null, req.user);
      },

      fetchUserAvatar: ['updateFields', (cb, results) => {
        userlib.fetchAvatar(results.updateFields).tap(user => {
          const { avatar } = user;
          if (avatar && avatar.indexOf('/static') !== 0 && avatar.indexOf(app.knox.bucket) === -1) {
            imageUrlToAmazonUrl(app.knox, avatar, (error, aws_src) => {
              user.avatar = error ? user.avatar : aws_src;
              cb(null, user);
            });
          } else {
            cb(null, user);
          }
        })
        .catch(cb);
      }],

      update: ['fetchUserAvatar', (cb, results) => {
        const user = results.fetchUserAvatar;

        user.updatedAt = new Date();
        user
          .save()
          .then(u => cb(null, u.info))
          .catch(cb);
      }]
    }, (err, results) => {
      if (err) return next(err);
      res.send(results.update);
    });
  };

  /*
   * End point for social media avatar lookup from the public donation page
   * Only works if password is null, as an extra precaution
   */
  const getSocialMediaAvatars = (req, res, next) => {
    if (req.user.hasPassword()) {
      return next(new errors.BadRequest('Can\'t lookup user avatars with password from this route'));
    }

    const { userData } = req.body;
    userData.email = req.user.email;
    userData.ip = req.ip;

    userlib.resolveUserAvatars(userData, (err, results) => {
      res.send(results);
    });
  };

  const _create = user => userlib.fetchInfo(user)
    .then(user => User.create(user))
    .tap(dbUser => Activity.create({
      type: constants.USER_CREATED,
      UserId: dbUser.id,
      data: {user: dbUser.info}
    }));

  const updatePassword = (req, res, next) => {
    const { password }= req.required;
    const { passwordConfirmation } = req.required;

    if (password !== passwordConfirmation) {
      return next(new errors.BadRequest('password and passwordConfirmation don\'t match'));
    }

    req.user.password = password;

    req.user.save()
      .then(() => res.send({success: true}))
      .catch(next);
  };

  const forgotPassword = (req, res, next) => {
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

  const resetPassword = (req, res, next) => {
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
  return {

    /**
     * Create a user.
     */
    create: (req, res, next) => {
      const { user } = req.required;
      user.ApplicationId = req.application.id;

      _create(user)
        .tap(user => res.send(user.info))
        .catch(next);
    },

    _create,

    /**
     * Get token.
     */
    getToken: (req, res) => {
      res.send({
        access_token: req.user.jwt(req.application),
        refresh_token: req.user.refresh_token
      });
    },

    /**
     * Show.
     */
    show: (req, res, next) => {

      const userData = req.user.show;

      if (req.remoteUser && req.remoteUser.id === req.user.id) {
        req.user.getStripeAccount()
          .then((account) => {
            const response = Object.assign(userData, req.user.info, { stripeAccount: account });
            res.send(response);
          })
          .catch(next);
      } else if (req.query.profile) {
        const groupInfoArray = []
        req.user.getGroups()
        .then(groups => {
          return Promise.all(groups.map(group => {
            return Promise.all([
              group.getYearlyIncome(),
              new Promise((resolve, reject) => {
                const appendTier = (backers) => {
                  backers = backers.map((backer) => {
                    backer.tier = getTier(backer, group.tiers);
                    return backer;
                  });
                  return backers;
                }

                queries.getUsersFromGroupWithTotalDonations(group.id)
                  .then(appendTier)
                  .then(resolve)
                  .catch(reject);
              })
            ])
            .then(results => {
              let groupInfo = group.info;
              groupInfo.yearlyIncome = results[0];
              const usersByRole = groupBy(results[1], 'role');
              const backers = usersByRole[roles.BACKER] || [];
              groupInfo.backersAndSponsorsCount = backers.length;
              groupInfo.sponsorsCount = filter(values(backers), {tier: 'sponsor'}).length;
              groupInfo.backersCount = groupInfo.backersAndSponsorsCount - groupInfo.sponsorsCount;
              groupInfo = Object.assign(groupInfo, { role: group.UserGroup.role, createdAt: group.UserGroup.createdAt });
              groupInfoArray.push(groupInfo);
              return group;
            })
          }))
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
    },

    /**
     * Get a user's groups.
     */
    getGroups: (req, res, next) => {
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
    },

    /**
     * For the case when a user has submitted an expired token,
     * we can automatically detect the email address and send a refreshed token.
     */
    refreshTokenByEmail: (req, res, next) => {
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
        loginLink: user.generateLoginLink(req.application, redirect)
      })
      .then(() => res.send({ success: true }))
      .catch(next);
    },

    /**
     * Send an email with the new token
     */
    sendNewTokenByEmail: (req, res, next) => {
      if (!req.application || !req.required.email) {
        return next(new Unauthorized('Unauthorized'))
      }
      let redirect;
      if (req.body.redirect) {
        ({ redirect } = req.body);
      } else {
        redirect = '/';
      }
      return models.User.findOne({
        where: {
          email: req.required.email
        }
      })
      .then((user) => {
        // If you don't find a user, proceed without error
        // Otherwise, we can leak email addresses
        if (user) {
          return emailLib.send('user.new.token', req.body.email, {
            loginLink: user.generateLoginLink(req.application, redirect)
          });
        }
        return null;
      })
      .then(() => res.send({ success: true }))
      .catch(next);
    },

    updatePaypalEmail,
    updateAvatar,
    updateUserWithoutLoggedIn,
    getSocialMediaAvatars,
    updatePassword,
    forgotPassword,
    resetPassword
  };
};
