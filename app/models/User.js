/**
 * Dependencies.
 */
const _ = require('lodash');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const errors = require('../lib/errors');
const utils = require('../lib/utils');
const config = require('config');
const moment = require('moment');

/**
 * Constants.
 */
var SALT_WORK_FACTOR = 10;

/**
 * Model.
 */
module.exports = function(Sequelize, DataTypes) {

  var User = Sequelize.define('User', {

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
      allowNull: false,
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
      unique: true, // need that? http://stackoverflow.com/questions/16356856/sequelize-js-custom-validator-check-for-unique-username-password
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
      set: function(val) {
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
      set: function(val) {
        this.setDataValue('resetPasswordToken', val);
        this.setDataValue('resetPasswordTokenHash', bcrypt.hashSync(val, this._salt));
      }
    },

    resetPasswordSentAt: DataTypes.DATE,

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
      info: function() {
        return {
          id: this.id,
          name: this.name,
          username: this.username,
          email: this.email,
          avatar: this.avatar,
          twitterHandle: this.twitterHandle,
          website: this.website,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          paypalEmail: this.paypalEmail
        };
      },

      // Show (to any other user).
      show: function() {
        return {
          id: this.id,
          name: this.name,
          username: this.username,
          avatar: this.avatar,
          twitterHandle: this.twitterHandle,
          website: this.website,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      },

      // Minimal (used to feed the jwt token)
      minimal: function() {
        return {
          id: this.id,
          username: this.username,
          avatar: this.avatar,
          name: this.name,
          email: this.email
        };
      },

      // Used for the public group
      public: function() {
        return {
          id: this.id,
          avatar: this.avatar,
          name: this.name,
          website: this.website,
          twitterHandle: this.twitterHandle
        };
      }
    },

    instanceMethods: {
      // JWT token.
      jwt: function(application, payload) {
        const secret = config.keys.opencollective.secret;

        // We are sending too much data (large jwt) but the app and website
        // need the id and email. We will refactor that progressively to have
        // a smaller token.
        const data = _.extend({}, payload, {
          id: this.id,
          email: this.email
        });

        return jwt.sign(data, secret, {
          expiresInMinutes: 60 * 24 * 30, // 1 month
          subject: this.id, // user
          issuer: config.host.api,
          audience: application.id
        });
      },

      hasPassword() {
        return _.isString(this.password_hash);
      },

      encryptId() {
        return utils.encrypt(String(this.id));
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

      generateSubscriptionsLink(application) {
        const token = this.jwt(application, { scope: 'subscriptions' });

        return `${config.host.website}/subscriptions/${token}`;
      }

    },

    classMethods: {
      auth: function(usernameOrEmail, password, fn) {
        var msg = 'Invalid username/email or password.';
        usernameOrEmail = usernameOrEmail.toLowerCase();

        User
          .find({ where: ['username = ? OR email = ?', usernameOrEmail, usernameOrEmail] })
          .then(function(user) {
            if (!user) return fn(new errors.BadRequest(msg));

            bcrypt.compare(password, user.password_hash, function(err, matched) {
              if (!err && matched) {
                user.updateAttributes({
                  seenAt: new Date()
                }).done(fn);
              } else {
                fn(new errors.BadRequest(msg));
              }
            });
          })
          .catch(fn);
      },

      decryptId(encrypted) {
        return utils.decrypt(encrypted);
      }
    }

  });

  return User;
};
