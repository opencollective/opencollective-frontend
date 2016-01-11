/**
 * Dependencies.
 */
var slug = require('slug');
var errors = require('../lib/errors');

/**
 * Model.
 */
module.exports = function(Sequelize, DataTypes) {

  var Group = Sequelize.define('Group', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      set: function(val) {
        this.setDataValue('name', val);
      }
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

    isHost: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    slug: {
      type: DataTypes.STRING
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
          isHost: this.isHost,
          slug: this.slug
        };
      }
    },

    instanceMethods: {
      isMember: function(userId, roles, fn) {
        if (!roles || typeof roles === 'function') {
          fn = roles;
          roles = null;
        }

        this
          .getMembers({where: {id: userId} })
          .then(function(members) {
            if (members.length === 0)
              return fn(new errors.Forbidden('Unauthorized to access this group.'), false);
            else {
              if (roles && roles.indexOf(members[0].UserGroup.role) < 0)
                return fn(new errors.Forbidden('Unauthorized to manage this group.'), false);
              fn(null, true);
            }
          })
          .catch(fn);
      }
    }
  });

  return Group;
};
