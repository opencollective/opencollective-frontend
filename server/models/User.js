/**
 * Dependencies.
 */
import _ from 'lodash';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from 'config';
import moment from 'moment';
import Promise from 'bluebird';
import slug from 'slug';

import {decrypt, encrypt} from '../lib/utils';
import errors from '../lib/errors';
import queries from '../lib/queries';
import userLib from '../lib/userlib';
import knox from '../gateways/knox';
import imageUrlLib from '../lib/imageUrlToAmazonUrl';

import { hasRole } from '../lib/auth';

/**
 * Constants.
 */
const SALT_WORK_FACTOR = 10;

/**
 * Model.
 */
export default (Sequelize, DataTypes) => {

  const models = Sequelize.models;

  const User = Sequelize.define('User', {

    _access: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,

    name: {
      type: DataTypes.VIRTUAL(DataTypes.STRING, ['firstName','lastName']),
      get() {
        const firstName = this.get('firstName');
        const lastName = this.get('lastName');
        if (firstName && lastName) {
          return `${firstName} ${lastName}`;
        } else if (firstName || lastName) {
          return firstName || lastName;
        } else {
          return null;
        }
      }
    },

    username: {
      type: DataTypes.STRING,
      unique: true,
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('username', slug(val).toLowerCase());
        }
      }
    },

    image: DataTypes.STRING,

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
          msg: 'Email must be between 6 and 128 characters in length'
        },
        isEmail: {
          msg: 'Email must be valid'
        }
      }
    },

    mission: DataTypes.STRING,
    description: DataTypes.STRING,
    longDescription: DataTypes.TEXT,
    organization: DataTypes.STRING,
    isOrganization: DataTypes.BOOLEAN, // e.g. DigitalOcean, PubNub, ...
    currency: {
      type: DataTypes.STRING,
      validate: {
        len: 3
      },
      set(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },
    twitterHandle: {
      type: DataTypes.STRING, // without the @ symbol. Ex: 'asood123'
      set(val) {
        if (typeof val === 'string') {
          this.setDataValue('twitterHandle', val.replace(/^@/,''));
        }
      }
    },

    billingAddress: DataTypes.STRING, // Used for the invoices, we should create a separate table for addresses (billing/shipping)

    website: {
      type: DataTypes.STRING,
      get() {
        if (this.getDataValue('website')) return this.getDataValue('website');
        return (this.getDataValue('twitterHandle')) ? `https://twitter.com/${this.getDataValue('twitterHandle')}` : null;
      }
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
          msg: 'Email must be between 6 and 128 characters in length'
        },
        isEmail: {
          msg: 'Email must be valid'
        }
      }
    },

    _salt: {
      type: DataTypes.STRING,
      defaultValue: bcrypt.genSaltSync(SALT_WORK_FACTOR)
    },
    refresh_token: {
      type: DataTypes.STRING,
      defaultValue: bcrypt.genSaltSync(SALT_WORK_FACTOR)
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
          msg: 'Password must be between 6 and 128 characters in length'
        }
      }
    },

    resetPasswordTokenHash: DataTypes.STRING,
    // hash the token to avoid someone with access to the db to generate passwords
    resetPasswordToken: {
      type: DataTypes.VIRTUAL,
      set(val) {
        this.setDataValue('resetPasswordToken', val);
        this.setDataValue('resetPasswordTokenHash', bcrypt.hashSync(val, this._salt));
      }
    },

    resetPasswordSentAt: DataTypes.DATE,

    referrerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    seenAt: DataTypes.DATE

  }, {
    paranoid: true,

    getterMethods: {

      // Info (private).
      info() {
        return {
          id: this.id,
          firstName: this.firstName,
          lastName: this.lastName,
          name: this.name,
          username: this.username,
          email: this.email,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          organization: this.organization,
          isOrganization: this.isOrganization,
          image: this.image,
          twitterHandle: this.twitterHandle,
          website: this.website,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          paypalEmail: this.paypalEmail
        };
      },

      // Show (to any other user).
      show() {
        return {
          id: this.id,
          firstName: this.firstName,
          lastName: this.lastName,
          name: this.name,
          username: this.username,
          image: this.image,
          twitterHandle: this.twitterHandle,
          website: this.website,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          organization: this.organization,
          isOrganization: this.isOrganization,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      },

      minimal() {
        return {
          id: this.id,
          username: this.username,
          image: this.image,
          firstName: this.firstName,
          lastName: this.lastName,
          name: this.name,
          email: this.email,
          paypalEmail: this.paypalEmail
        };
      },

      // Used for the public collective
      public() {
        return {
          id: this.id,
          image: this.image,
          firstName: this.firstName,
          lastName: this.lastName,
          name: this.name,
          username: this.username,
          website: this.website,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          organization: this.organization,
          isOrganization: this.isOrganization,
          twitterHandle: this.twitterHandle
        };
      }
    },

    instanceMethods: {
      // JWT token.
      jwt(payload, expiresInHours) {
        const { secret } = config.keys.opencollective;
        expiresInHours = expiresInHours || 24*30; // 1 month

        // We are sending too much data (large jwt) but the app and website
        // need the id and email. We will refactor that progressively to have
        // a smaller token.
        const data = _.extend({}, payload, {
          id: this.id,
          email: this.email
        });

        return jwt.sign(data, secret, {
          expiresIn: 60 * 60 * expiresInHours,
          subject: this.id, // user
          issuer: config.host.api
        });
      },

      hasMissingInfo() {
        return !(this.firstName && this.image);
      },

      encryptId() {
        return encrypt(String(this.id));
      },

      generateResetUrl(plainToken) {
        const encId = this.encryptId();
        return `${config.host.webapp}/reset/${encId}/${plainToken}/`;
      },

      checkResetToken(token, cb) {
        const today = moment();
        const resetPasswordSentAt = moment(this.resetPasswordSentAt);
        const daysDifference = today.diff(resetPasswordSentAt, 'days');

        if (daysDifference > 0) {
          return cb(new errors.BadRequest('The reset token has expired'));
        }

        if (!this.resetPasswordTokenHash) {
          return cb(new errors.BadRequest('The reset token does not exist'))
        }

        bcrypt.compare(token, this.resetPasswordTokenHash, (err, matched) => {
          if (err) return cb(err);
          if (!matched) return cb(new errors.BadRequest('The reset token is invalid'));

          cb();
        });
      },

      generateLoginLink(redirect) {
        const expiresInHours = 24*30;
        const token = this.jwt({ scope: 'login' }, expiresInHours);

        return `${config.host.website}/login/${token}?next=${redirect}`;
      },

      generateConnectedAccountVerifiedToken(connectedAccountId, username) {
        const expiresInHours = 24;
        return this.jwt({ scope: 'connected-account', connectedAccountId, username }, expiresInHours);
      },

      getLatestDonations(since, until, tags) {
        tags = tags || [];
        return models.Transaction.findAll({
          where: {
            UserId: this.id,
            createdAt: { $gte: since || 0, $lt: until || new Date}
          },
          order: [ ['amount','DESC'] ],
          include: [ { model: models.Collective, where: { tags: { $contains: tags } } } ]
        });
      },

      getCollectivesWithRoles() {
        return this.getCollectives({
          include: [{ model: models.Role, where: { UserId: this.id }}]
        })
        .then(collectives => collectives.map(g => {
          g.role = g.Role.role;
          return g;
        }))
      },

      getRoles() {
        return models.Role.findAll({
          where: {
            UserId: this.id
          }
        });
      },

      unsubscribe(CollectiveId, type, channel = 'email') {
        const notification = {
          UserId: this.id,
          CollectiveId,
          type,
          channel
        };
        return models.Notification.findOne({ where: notification })
        .then(result => {
          if (result) return result.update({active: false})
          else {
            notification.active = false;
            return models.Notification.create(notification);
          }
        })
      },

      canEditCollective(collectiveid) {
        return hasRole(this.id, collectiveid, ['MEMBER', 'HOST']);
      },

      updateWhiteListedAttributes(attributes) {

        let update = false;
        const allowedFields = 
          [ 'username',
            'firstName',
            'lastName',
            'description',
            'longDescription',
            'twitterHandle',
            'website',
            'image',
            'paypalEmail'];

        if (attributes.name) {
          const nameTokens = attributes.name.split(' ');
          this.firstName = nameTokens.shift();
          this.lastName = nameTokens.join(' ');
          update = true;
        }

        return Promise.map(allowedFields, prop => {
          if (attributes[prop]) {
            this[prop] = attributes[prop];
            update = true;
          }

          if (prop === 'username') {
            return Sequelize.query(`
              with usernames as (SELECT username FROM "Users" UNION SELECT slug as username FROM "Collectives")
              SELECT COUNT(*) FROM usernames WHERE username='${attributes[prop]}'
              `, {
                type: Sequelize.QueryTypes.SELECT
              })
            .then(res => {
              const count = res[0].count;
              if (count > 0) throw new errors.BadRequest(`username ${attributes[prop]} is already taken`);
            })
          }
        })
        .then(() => this.image || userLib.fetchAvatar(this.email))
        .then(image => {
          if (image && image.indexOf('/public') !== 0 && image.indexOf(config.aws.s3.bucket) === -1) {
            return Promise.promisify(imageUrlLib.imageUrlToAmazonUrl, { context: imageUrlLib })(knox, image)
              .then((aws_src, error) => {
                this.image = error ? this.image : aws_src;
                update = true;
              });
          } else {
            Promise.resolve();
          }
        })
        .then(() => {
          if (update) {
            return this.save();
          } else {
            return this
          }
        })
      },

    },

    classMethods: {

      createMany: (users, defaultValues = {}) => {
        return Promise.map(users, u => User.create(_.defaults({},u,defaultValues)), {concurrency: 1});
      },

      auth(usernameOrEmail, password, cb) {
        const msg = 'Invalid username/email or password.';
        usernameOrEmail = usernameOrEmail.toLowerCase();

        User.find({
          where: ['username = ? OR email = ?', usernameOrEmail, usernameOrEmail]
        })
        .then((user) => {
          if (!user) return cb(new errors.BadRequest(msg));

          bcrypt.compare(password, user.password_hash, (err, matched) => {
            if (!err && matched) {
              user.updateAttributes({
                seenAt: new Date()
              })
                .tap(user => cb(null, user))
                .catch(cb);
            } else {
              cb(new errors.BadRequest(msg));
            }
          });
        })
        .catch(cb);
      },

      decryptId(encrypted) {
        return decrypt(encrypted);
      },

      getTopBackers(since, until, tags, limit) {
        return queries.getTopBackers(since || 0, until || new Date, tags, limit || 5);
      },

      findOrCreateByEmail(email, otherAttributes) {
        return User.findOne({
          where: {
            $or: {
              email,
              paypalEmail: email
            }
          }
        })
        .then(user => user || models.User.create(Object.assign({}, { email }, otherAttributes)))
      },

      splitName(name) {
        let firstName = null, lastName = null;
        if (name) {
          const tokens = name.split(' ');
          firstName = tokens[0];
          lastName = tokens.length > 1 ? tokens.slice(1).join(' ') : null;
        }
        return { firstName, lastName };
      }
    },

    hooks: {
      beforeCreate: (instance) => {
        if (!instance.username) {
          return userLib.suggestUsername(instance)
            .then(username => {
              if (!username) {
                return Promise.reject(new Error('A user must have a username'));
              }
              instance.username = username;
              return Promise.resolve();
            });
        }
        return Promise.resolve();

      },
      afterCreate: (instance) => {
        models.Notification.createMany([{ type: 'user.yearlyreport' }, { type: 'user.monthlyreport' }], { channel: 'email', UserId: instance.id })
          .then(() => userLib.updateUserInfoFromClearbit(instance));
        return null;
      }
    }
  });

  return User;
};
