/**
 * Dependencies.
 */
const _ = require('lodash');
const Joi = require('joi');
const config = require('config');
const errors = require('../lib/errors');

const roles = require('../constants/roles');
const constants = require('../constants/transactions');

const tier = Joi.object().keys({
  name: Joi.string().required(), // lowercase, act as a slug. E.g. "donors", "sponsors", "backers", "members", ...
  title: Joi.string().required(), // e.g. "Sponsors"
  description: Joi.string().required(), // what do people get as a member of this tier?
  button: Joi.string().required(), // Call To Action, e.g. "Become a sponsor"
  range: Joi.array().items(Joi.number().integer()).length(2).required(), // e.g. [100, 10000000]: Need to donate at least $100/interval to be a sponsor
  presets: Joi.array().items(Joi.number().integer()), // e.g. [1, 5, 20] for presets of $1, $5 and $20
  interval: Joi.string().valid(['monthly', 'yearly', 'one-time']).required()
});

const tiers = Joi.array().items(tier);

/**
 * Model.
 */
module.exports = function(Sequelize, DataTypes) {

  var Group = Sequelize.define('Group', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    mission: DataTypes.STRING(100),

    description: DataTypes.STRING, // max 95 characters

    longDescription: DataTypes.TEXT,
    whyJoin: DataTypes.TEXT,

    // We should update those two fields periodically (but no need to be real time)
    budget: DataTypes.INTEGER, // yearly budget in cents
    burnrate: DataTypes.INTEGER, // monthly burnrate (last 3 months average, in cents)

    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },

    logo: DataTypes.STRING,

    video: DataTypes.STRING,

    image: DataTypes.STRING,
    backgroundImage: DataTypes.STRING,

    expensePolicy: DataTypes.TEXT,

    tiers: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        schema: (value) => {
          Joi.validate(value, tiers, (err) => {
            if (err) throw new Error(err.details[0].message);
          })
        }
      }
    },

    settings: {
      type: DataTypes.JSON,
      allowNull: true
    },

    data: {
      type: DataTypes.JSON,
      allowNull: true
    },

    hostFeePercent: {
      type: DataTypes.FLOAT,
      defaultValue: constants.HOST_FEE_PERCENT
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    slug: {
      type: DataTypes.STRING,
      unique: true,
      set(slug) {
        if (slug && slug.toLowerCase) {
          this.setDataValue('slug', slug.toLowerCase());
        }
      }
    },

    twitterHandle: {
      type: DataTypes.STRING, // without the @ symbol. Ex: 'asood123'
      set(username) {
        if (username.substr(0,1) === '@') {
          this.setDataValue('twitterHandle', username.substr(1));
        }
      }
    },

    website: DataTypes.STRING,

    publicUrl: {
      type: new DataTypes.VIRTUAL(DataTypes.STRING, ['slug']),
      get() {
        return `${config.host.website}/${this.get('slug')}`;
      }
    },

    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING)
    },

    isSupercollective: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }

  }, {
    paranoid: true,

    getterMethods: {
      // Info.
      info: function() {
        return {
          id: this.id,
          name: this.name,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          whyJoin: this.whyJoin,
          budget: this.budget,
          burnrate: this.burnrate,
          currency: this.currency,
          logo: this.logo,
          video: this.video,
          image: this.image,
          backgroundImage: this.backgroundImage,
          expensePolicy: this.expensePolicy,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          isPublic: this.isPublic,
          slug: this.slug,
          tiers: this.tiers,
          settings: this.settings,
          website: this.website,
          twitterHandle: this.twitterHandle,
          publicUrl: this.publicUrl,
          hostFeePercent: this.hostFeePercent,
          tags: this.tags,
          isSupercollective: this.isSupercollective
        };
      },
      minimal: function() {
        return {
          id: this.id,
          name: this.name,
          logo: this.logo,
          publicUrl: this.publicUrl,
          mission: this.mission,
          isSupercollective: this.isSupercollective
        }
      }
    },

    instanceMethods: {
      hasUserWithRole(userId, roles, cb) {
        this
          .getUsers({
            where: {
              id: userId
            }
          })
          .tap((users) => {
            if (users.length === 0) {
              return cb(null, false);
            } else if (!_.contains(roles, users[0].UserGroup.role)) {
              return cb(null, false);
            }

            cb(null, true);
          })
          .catch(cb);
      },

      addUserWithRole(user, role) {
        return Sequelize.models.UserGroup.create({
          role,
          UserId: user.id,
          GroupId: this.id
        });
      },

      getStripeAccount() {
        return Sequelize.models.UserGroup.find({
          where: {
            GroupId: this.id,
            role: roles.HOST
          }
        })
        .then((userGroup) => {
          if (!userGroup) {
            return { stripeAccount: null };
          }

          return Sequelize.models.User.find({
            where: {
              id: userGroup.UserId
            },
            include: [{
              model: Sequelize.models.StripeAccount
            }]
          });
        })
        .then((user) => user.StripeAccount);
      },

      getConnectedAccount() {
        const models = Sequelize.models;

        return models.UserGroup.find({
          where: {
            GroupId: this.id,
            role: roles.HOST
          }
        })
        .then((userGroup) => {
          if (!userGroup) {
            throw new errors.NotFound(`No group with ID ${GroupId} and host user found`);
          }

          return models.ConnectedAccount.find({
            where: {
              UserId: userGroup.UserId
            }
          });
        });
      },

      hasHost() {
        return Sequelize.models.UserGroup.find({
          where: {
            GroupId: this.id,
            role: roles.HOST
          }
        })
        .then(userGroup => Promise.resolve(!!userGroup));
      }

    }
  });

  return Group;
};
