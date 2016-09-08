/**
 * Dependencies.
 */
import _ from 'lodash';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import errors from '../lib/errors';
import {decrypt, encrypt} from '../lib/utils';
import config from 'config';
import moment from 'moment';
import Promise from 'bluebird';
import queries from '../lib/queries';

/**
 * Constants.
 */
const SALT_WORK_FACTOR = 10;

/**
 * Model.
 */
export default (Sequelize, DataTypes) => {

  const User = Sequelize.define('User', {

    _access: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    name: DataTypes.STRING,

    username: {
      type: DataTypes.STRING,
      unique: true,
      set(val) {
        if (val && val.toLowerCase) {
          this.setDataValue('username', val.toLowerCase());
        }
      }
    },

    avatar: DataTypes.STRING,

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
    isOrganization: DataTypes.BOOLEAN, // e.g. DigitalOcean, PubNub, ...

    twitterHandle: {
      type: DataTypes.STRING, // without the @ symbol. Ex: 'asood123'
      validate: {
        notContains: {
          args: '@',
          msg: 'twitterHandle must be without @ symbol'
        }
      }
    },

    website: DataTypes.STRING,

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
          name: this.name,
          username: this.username,
          email: this.email,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          isOrganization: this.isOrganization,
          avatar: this.avatar,
          twitterHandle: this.twitterHandle,
          website: this.website,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          hasFullAccount: this.hasPassword(),
          paypalEmail: this.paypalEmail
        };
      },

      // Show (to any other user).
      show() {
        return {
          id: this.id,
          name: this.name,
          username: this.username,
          avatar: this.avatar,
          twitterHandle: this.twitterHandle,
          website: this.website,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          isOrganization: this.isOrganization,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      },

      // Minimal (used to feed the jwt token)
      minimal() {
        return {
          id: this.id,
          username: this.username,
          avatar: this.avatar,
          name: this.name,
          email: this.email
        };
      },

      // Used for the public group
      public() {
        return {
          id: this.id,
          avatar: this.avatar,
          name: this.name,
          website: this.website,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          isOrganization: this.isOrganization,
          twitterHandle: this.twitterHandle
        };
      }
    },

    instanceMethods: {
      // JWT token.
      jwt(application, payload, expiresInHours) {
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
          issuer: config.host.api,
          audience: application.id
        });
      },

      hasPassword() {
        return _.isString(this.password_hash);
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

      generateLoginLink(application, redirect) {
        const expiresInHours = 24*30;
        const token = this.jwt(application, { scope: 'login' }, expiresInHours);

        return `${config.host.website}/login/${token}?next=${redirect}`;
      },

      generateConnectedAccountVerifiedToken(application, connectedAccountId, username) {
        const expiresInHours = 24;
        return this.jwt(application, { scope: 'connected-account', connectedAccountId, username }, expiresInHours);
      },

      getLatestDonations(since, until, tags) {
        tags = tags || [];
        return Sequelize.models.Transaction.findAll({
          where: {
            UserId: this.id,
            createdAt: { $gte: since || 0, $lt: until || new Date}
          },
          order: [ ['amount','DESC'] ],
          include: [ { model: Sequelize.models.Group, where: { tags: { $contains: tags } } } ]
        });
      }

    },

    classMethods: {

      createMany: (users, defaultValues) => {
        const promises = [];
        for (let i=0; i < users.length; i++) {
          const u = users[i];
          for (const attr in defaultValues) {
            u[attr] = defaultValues[attr];
          }
          promises.push(User.create(u).catch(e => {
            console.error("Error in creating user", u, e, e.stack);
          }));
        }
        return Promise.all(promises).catch(console.error);
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
      }
    }

  });

  return User;
};