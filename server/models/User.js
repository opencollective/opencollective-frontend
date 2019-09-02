import bcrypt from 'bcrypt';
import config from 'config';
import Promise from 'bluebird';
import slugify from 'limax';
import debugLib from 'debug';
import { defaults, intersection } from 'lodash';
import { Op } from 'sequelize';

import logger from '../lib/logger';
import * as auth from '../lib/auth';
import errors from '../lib/errors';
import userLib from '../lib/userlib';
import roles from '../constants/roles';
import { isValidEmail } from '../lib/utils';

const debug = debugLib('user');

/**
 * Constants.
 */
const SALT_WORK_FACTOR = 10;

/**
 * Model.
 */
export default (Sequelize, DataTypes) => {
  const { models } = Sequelize;

  const User = Sequelize.define(
    'User',
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,

      email: {
        type: DataTypes.STRING,
        unique: true, // need that? http://stackoverflow.com/questions/16356856/sequelize-js-custom-validator-check-for-unique-username-password
        set(val) {
          if (val && val.toLowerCase) {
            this.setDataValue('email', val.toLowerCase());
          }
        },
        validate: {
          len: {
            args: [6, 128],
            msg: 'Email must be between 6 and 128 characters in length',
          },
          isEmail: {
            msg: 'Email must be valid',
          },
        },
      },

      emailWaitingForValidation: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Email must be valid',
          },
        },
      },

      emailConfirmationToken: {
        type: DataTypes.STRING,
      },

      paypalEmail: {
        type: DataTypes.STRING,
        unique: true, // need that? http://stackoverflow.com/questions/16356856/sequelize-js-custom-validator-check-for-unique-username-password,
        set(val) {
          if (val && val.toLowerCase) {
            this.setDataValue('paypalEmail', val.toLowerCase());
          }
        },
        validate: {
          len: {
            args: [6, 128],
            msg: 'Email must be between 6 and 128 characters in length',
          },
          isEmail: {
            msg: 'Email must be valid',
          },
        },
      },

      _salt: {
        type: DataTypes.STRING,
        defaultValue: bcrypt.genSaltSync(SALT_WORK_FACTOR),
      },
      refresh_token: {
        type: DataTypes.STRING,
        defaultValue: bcrypt.genSaltSync(SALT_WORK_FACTOR),
      },
      password_hash: DataTypes.STRING,
      password: {
        type: DataTypes.VIRTUAL,
        set(val) {
          const password = String(val);
          this.setDataValue('password', password);
          this.setDataValue('password_hash', bcrypt.hashSync(password, this._salt));
        },
        validate: {
          len: {
            args: [6, 128],
            msg: 'Password must be between 6 and 128 characters in length',
          },
        },
      },

      resetPasswordTokenHash: DataTypes.STRING,
      // hash the token to avoid someone with access to the db to generate passwords
      resetPasswordToken: {
        type: DataTypes.VIRTUAL,
        set(val) {
          this.setDataValue('resetPasswordToken', val);
          this.setDataValue('resetPasswordTokenHash', bcrypt.hashSync(val, this._salt));
        },
      },

      resetPasswordSentAt: DataTypes.DATE,

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      seenAt: DataTypes.DATE,

      newsletterOptIn: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
    },
    {
      paranoid: true,

      getterMethods: {
        // Collective of type USER corresponding to this user
        userCollective() {
          return models.Collective.findByPk(this.CollectiveId).then(userCollective => {
            if (!userCollective) {
              logger.info(
                `No Collective attached to this user id ${this.id} (User.CollectiveId: ${this.CollectiveId})`,
              );
              return {};
            }
            return userCollective;
          });
        },

        username() {
          return this.userCollective.then(collective => collective.slug);
        },

        name() {
          return this.userCollective.then(collective => collective.name);
        },

        twitterHandle() {
          return this.userCollective.then(collective => collective.twitterHandle);
        },

        githubHandle() {
          return this.userCollective.then(collective => collective.githubHandle);
        },

        website() {
          return this.userCollective.then(collective => collective.website);
        },

        description() {
          return this.userCollective.then(collective => collective.description);
        },

        longDescription() {
          return this.userCollective.then(collective => collective.longDescription);
        },

        image() {
          return this.userCollective.then(collective => collective.image);
        },

        // Info (private).
        info() {
          return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            emailWaitingForValidation: this.emailWaitingForValidation,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            paypalEmail: this.paypalEmail,
          };
        },

        // Show (to any other user).
        show() {
          return {
            id: this.id,
            CollectiveId: this.CollectiveId,
            firstName: this.firstName,
            lastName: this.lastName,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
          };
        },

        minimal() {
          return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            paypalEmail: this.paypalEmail,
          };
        },

        // Used for the public collective
        public() {
          return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
          };
        },
      },

      hooks: {
        afterCreate: instance => {
          userLib.updateUserInfoFromClearbit(instance);
          return null;
        },
      },
    },
  );

  /** Instance Methods */

  /**
   * Generate a JWT for user.
   *
   * @param {object} `payload` - data to attach to the token
   * @param {Number} `expiration` - expiration period in seconds
   */
  User.prototype.jwt = function(payload, expiration) {
    expiration = expiration || auth.TOKEN_EXPIRATION_LOGIN;
    return auth.createJwt(this.id, payload, expiration);
  };

  User.prototype.generateLoginLink = function(redirect = '/', websiteUrl) {
    const token = this.jwt({ scope: 'login' });
    // if a different websiteUrl is passed
    // we don't accept that in production to avoid fishing related issues
    if (websiteUrl && config.env !== 'production') {
      return `${websiteUrl}/signin/${token}?next=${redirect}`;
    } else {
      return `${config.host.website}/signin/${token}?next=${redirect}`;
    }
  };

  User.prototype.generateConnectedAccountVerifiedToken = function(connectedAccountId, username) {
    const payload = {
      scope: 'connected-account',
      connectedAccountId,
      username,
    };
    return this.jwt(payload, auth.TOKEN_EXPIRATION_CONNECTED_ACCOUNT);
  };

  User.prototype.getMemberships = function(options = {}) {
    const query = {
      where: {
        MemberCollectiveId: this.CollectiveId,
      },
      ...options,
    };
    return models.Member.findAll(query);
  };

  User.prototype.unsubscribe = function(CollectiveId, type, channel = 'email') {
    const notification = {
      UserId: this.id,
      CollectiveId,
      type,
      channel,
    };
    return models.Notification.findOne({ where: notification }).then(result => {
      if (result) return result.update({ active: false });
      else {
        notification.active = false;
        return models.Notification.create(notification);
      }
    });
  };

  User.prototype.getIncognitoProfile = function() {
    return models.Collective.findOne({ where: { isIncognito: true, CreatedByUserId: this.id } });
  };

  User.prototype.populateRoles = async function() {
    if (this.rolesByCollectiveId) {
      debug('roles already populated');
      return Promise.resolve(this);
    }
    const rolesByCollectiveId = {};
    const adminOf = [];
    const where = { MemberCollectiveId: this.CollectiveId };
    const incognitoProfile = await this.getIncognitoProfile();
    if (incognitoProfile) {
      where.MemberCollectiveId = { [Op.in]: [this.CollectiveId, incognitoProfile.id] };
    }
    const memberships = await models.Member.findAll({ where });
    memberships.map(m => {
      rolesByCollectiveId[m.CollectiveId] = rolesByCollectiveId[m.CollectiveId] || [];
      rolesByCollectiveId[m.CollectiveId].push(m.role);
      if (m.role === roles.ADMIN) {
        adminOf.push(m.CollectiveId);
      }
    });
    // If this User is an admin of a host, we also populate the role ADMIN for all the hosted collectives
    if (adminOf.length > 0) {
      const hostedMemberships = await models.Member.findAll({
        where: {
          MemberCollectiveId: { [Op.in]: adminOf },
          role: roles.HOST,
        },
      });
      hostedMemberships.map(m => {
        rolesByCollectiveId[m.CollectiveId] = rolesByCollectiveId[m.CollectiveId] || [];
        rolesByCollectiveId[m.CollectiveId].push(roles.ADMIN);
      });
    }
    this.rolesByCollectiveId = rolesByCollectiveId;
    debug('populateRoles', this.rolesByCollectiveId);
    return this;
  };

  User.prototype.hasRole = function(roles, CollectiveId) {
    if (!CollectiveId) {
      return false;
    }
    if (this.CollectiveId === Number(CollectiveId)) {
      return true;
    }
    if (!this.rolesByCollectiveId) {
      logger.info("User.rolesByCollectiveId hasn't been populated.");
      logger.debug(new Error().stack);
      return false;
    }
    if (typeof roles === 'string') {
      roles = [roles];
    }
    const result = intersection(this.rolesByCollectiveId[Number(CollectiveId)], roles).length > 0;
    debug('hasRole', 'userid:', this.id, 'has role', roles, ' in CollectiveId', CollectiveId, '?', result);
    return result;
  };

  // Adding some sugars
  User.prototype.isAdmin = function(CollectiveId) {
    const result = this.CollectiveId === Number(CollectiveId) || this.hasRole([roles.HOST, roles.ADMIN], CollectiveId);
    debug('isAdmin of CollectiveId', CollectiveId, '?', result);
    return result;
  };

  User.prototype.isRoot = function() {
    const result = this.hasRole([roles.ADMIN], 1);
    debug('isRoot?', result);
    return result;
  };

  User.prototype.isMember = function(CollectiveId) {
    const result =
      this.CollectiveId === CollectiveId || this.hasRole([roles.HOST, roles.ADMIN, roles.MEMBER], CollectiveId);
    debug('isMember of CollectiveId', CollectiveId, '?', result);
    return result;
  };

  // Determines whether a user can see updates for a collective based on their roles.
  User.prototype.canSeeUpdates = function(CollectiveId) {
    const result =
      this.CollectiveId === CollectiveId ||
      this.hasRole([roles.HOST, roles.ADMIN, roles.MEMBER, roles.CONTRIBUTOR, roles.BACKER], CollectiveId);
    debug('userid:', this.id, 'canSeeUpdates', CollectiveId, '?', result);
    return result;
  };

  User.prototype.getPersonalDetails = function(remoteUser) {
    if (!remoteUser) return Promise.resolve(this.public);
    return this.populateRoles()
      .then(() => {
        if (this.id === remoteUser.id) return true;
        // all the CollectiveIds that the remoteUser is admin of.
        const adminOfCollectives = Object.keys(remoteUser.rolesByCollectiveId).filter(CollectiveId =>
          remoteUser.isAdmin(CollectiveId),
        );
        const memberOfCollectives = Object.keys(this.rolesByCollectiveId);
        const canAccess = intersection(adminOfCollectives, memberOfCollectives).length > 0;
        debug(
          'getPersonalDetails',
          'remoteUser id:',
          remoteUser.id,
          'is admin of collective ids:',
          adminOfCollectives,
          'this user id:',
          this.id,
          'is member of',
          memberOfCollectives,
          'canAccess?',
          canAccess,
        );
        return canAccess;
      })
      .then(canAccess => {
        return canAccess ? this.info : this.public;
      });
  };

  /**
   * Class Methods
   */
  User.createMany = (users, defaultValues = {}) => {
    return Promise.map(users, u => User.create(defaults({}, u, defaultValues)), { concurrency: 1 });
  };

  User.auth = (email, password, cb) => {
    if (!email) return cb(new errors.BadRequest(msg));

    const msg = 'Invalid email or password.';
    email = email.toLowerCase();

    User.find({
      where: ['email = ?', email],
    })
      .then(user => {
        if (!user) return cb(new errors.BadRequest(msg));

        bcrypt.compare(password, user.password_hash, (err, matched) => {
          if (!err && matched) {
            user
              .updateAttributes({
                seenAt: new Date(),
              })
              .tap(user => cb(null, user))
              .catch(cb);
          } else {
            cb(new errors.BadRequest(msg));
          }
        });
      })
      .catch(cb);
  };

  User.findOrCreateByEmail = (email, otherAttributes) => {
    if (!isValidEmail(email)) {
      return Promise.reject(new Error('Please provide a valid email address'));
    }
    debug('findOrCreateByEmail', email, 'other attributes: ', otherAttributes);
    return User.findByEmailOrPaypalEmail(email).then(
      user => user || models.User.createUserWithCollective(Object.assign({}, { email }, otherAttributes)),
    );
  };

  User.findByEmailOrPaypalEmail = email => {
    return User.findOne({
      where: {
        [Op.or]: {
          email,
          paypalEmail: email,
        },
      },
    });
  };

  User.createUserWithCollective = async (userData, transaction) => {
    if (!userData) return Promise.reject(new Error('Cannot create a user: no user data provided'));

    const sequelizeParams = transaction ? { transaction } : undefined;
    debug('createUserWithCollective', userData);
    const user = await User.create(userData, sequelizeParams);
    let name = userData.firstName;
    if (name && userData.lastName) {
      name += ` ${userData.lastName}`;
    }

    // If user doesn't provide a name, set it to "incognito". If we cannot
    // slugify it (for example firstName="------") then fallback on "user".
    let collectiveName = userData.name || name;
    if (!collectiveName || collectiveName.trim().length === 0) {
      collectiveName = 'incognito';
    } else if (slugify(collectiveName).length === 0) {
      collectiveName = 'user';
    }

    const userCollectiveData = {
      type: 'USER',
      name: collectiveName,
      image: userData.image,
      mission: userData.mission,
      description: userData.description,
      longDescription: userData.longDescription,
      website: userData.website,
      twitterHandle: userData.twitterHandle,
      githubHandle: userData.githubHandle,
      currency: userData.currency,
      hostFeePercent: userData.hostFeePercent,
      isActive: true,
      CreatedByUserId: userData.CreatedByUserId || user.id,
      data: { UserId: user.id },
    };
    user.collective = await models.Collective.create(userCollectiveData, sequelizeParams);

    // It's difficult to predict when the image will be updated by findImageForUser
    // So we skip that in test environment to make it more predictable
    if (config.env !== 'test' && config.env !== 'circleci') {
      user.collective.findImageForUser(user);
    }
    user.CollectiveId = user.collective.id;
    await user.save(sequelizeParams);
    return user;
  };

  User.splitName = name => {
    let firstName = null,
      lastName = null;
    if (name) {
      const tokens = name.split(' ');
      firstName = tokens[0];
      lastName = tokens.length > 1 ? tokens.slice(1).join(' ') : null;
    }
    return { firstName, lastName };
  };

  return User;
};
