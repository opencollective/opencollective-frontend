/**
 * Dependencies.
 */
const _ = require('lodash');
const Joi = require('joi');
const config = require('config');

const roles = require('../constants/roles');

const tier = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().required(),
  button: Joi.string().required(),
  range: Joi.array().items(Joi.number().integer()).length(2).required(),
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
    description: DataTypes.STRING, // max 95 characters

    budget: DataTypes.FLOAT,
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },

    longDescription: DataTypes.TEXT('long'),

    logo: DataTypes.STRING,

    video: DataTypes.STRING,

    image: DataTypes.STRING,

    expensePolicy: DataTypes.STRING,

    membershipType: DataTypes.ENUM('donation', 'monthlyfee', 'yearlyfee'),
    membershipfee: DataTypes.FLOAT,

    tiers: {
      type: DataTypes.JSON,
      validate: {
        schema: (value) => {
          Joi.validate(value, tiers, (err) => {
            if (err) throw new Error(err.details[0].message);
          })
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

    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    slug: {
      type: DataTypes.STRING,
      set(slug) {
        if (slug && slug.toLowerCase) {
          this.setDataValue('slug', slug.toLowerCase());
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

    publicUrl: {
      type: new DataTypes.VIRTUAL(DataTypes.STRING, ['slug']),
      get() {
        return `${config.host.website}/${this.get('slug')}`;
      }
    }

  }, {
    paranoid: true,

    getterMethods: {
      // Info.
      info: function() {
        return {
          id: this.id,
          name: this.name,
          description: this.description,
          budget: this.budget,
          currency: this.currency,
          longDescription: this.longDescription,
          logo: this.logo,
          video: this.video,
          image: this.image,
          expensePolicy: this.expensePolicy,
          membershipType: this.membershipType,
          membershipfee: this.membershipfee,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          isPublic: this.isPublic,
          slug: this.slug,
          tiers: this.tiers,
          website: this.website,
          twitterHandle: this.twitterHandle,
          publicUrl: this.publicUrl
        };
      }
    },

    instanceMethods: {
      hasUserWithRole: function(userId, roles, cb) {
        this
          .getUsers({
            where: {
              id: userId
            }
          })
          .then(function(users) {
            if (users.length === 0) {
              return cb(null, false);
            } else if (!_.contains(roles, users[0].UserGroup.role)) {
              return cb(null, false);
            }

            cb(null, true);
          })
          .catch(cb);
      },

      getStripeAccount: function(cb) {
        Sequelize.models.UserGroup.find({
          where: {
            GroupId: this.id,
            role: roles.HOST
          }
        })
        .then(function(userGroup) {
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
        .then(function(user) {
          cb(null, user.StripeAccount);
        })
        .catch(cb);
      },

      hasHost: function(cb) {
        Sequelize.models.UserGroup.find({
          where: {
            GroupId: this.id,
            role: roles.HOST
          }
        })
        .then(function(userGroup) {
          return cb(null, !!userGroup);
        })
        .catch(cb);
      }

    }
  });

  return Group;
};
