/**
 * Dependencies.
 */
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var errors = require('../lib/errors');
var config = require('config');

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
      unique: true
    },

    avatar: DataTypes.STRING,

    email: {
      type: DataTypes.STRING,
      allowNull: false,
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
        this.setDataValue('password', val);
        this.setDataValue('password_hash', bcrypt.hashSync(val, this._salt));
      },
      validate: {
        len: {
          args: [6, 128],
          msg: 'Password must be between 6 and 128 characters in length'
        }
      }
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
      jwt: function(application) {
        var secret = config.keys.opencollective.secret;
        var payload = this.minimal;
        return jwt.sign(payload, secret, {
          expiresInMinutes: 60 * 24 * 30, // 1 month
          subject: this.id, // user
          issuer: config.host.api,
          audience: application.id
        });
      }
    },

    classMethods: {
      auth: function(usernameOrEmail, password, fn) {
        var msg = 'Invalid username/email or password.';

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
      }
    }

  });

  return User;
};
