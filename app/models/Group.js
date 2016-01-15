/**
 * Dependencies.
 */
var _ = require('lodash');
var config = require('config');
var errors = require('../lib/errors');
var roles = require('../constants/roles');

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
      type: DataTypes.STRING
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

    website: DataTypes.STRING

    publicUrl: {
      type: new DataTypes.VIRTUAL(DataTypes.STRING, ['slug']),
      get() {
        return `${config.host.webapp}/${this.get('slug')}`;
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
<<<<<<< 8520cbe90cf9e45d4438c01423a745a938380cd6
          website: this.website,
          twitterHandle: this.twitterHandle
=======
          publicUrl: this.publicUrl
>>>>>>> fetch group by slug and use eslint to keep in sync with client
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
