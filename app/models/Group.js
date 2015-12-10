/**
 * Dependencies.
 */
var errors = require('../lib/errors');

/**
 * Model.
 */
module.exports = function(Sequelize, DataTypes) {

  var Group = Sequelize.define('Group', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.STRING,

    budget: DataTypes.FLOAT,
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },

    membership_type: DataTypes.ENUM('donation', 'monthlyfee', 'yearlyfee'),
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
          membership_type: this.membership_type,
          membershipfee: this.membershipfee,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          isPublic: this.isPublic
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
