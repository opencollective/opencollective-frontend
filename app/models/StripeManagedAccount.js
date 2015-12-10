/**
 * Dependencies.
 */
var errors = require('../lib/errors');

/**
 * Model.
 */
module.exports = function(Sequelize, DataTypes) {

  var StripeManagedAccount = Sequelize.define('StripeManagedAccount', {
    stripeId: DataTypes.STRING,
    stripeSecret: DataTypes.STRING,
    stripeKey: DataTypes.STRING,
    stripeEmail: {
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

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }

  }, {
    paranoid: true,

    getterMethods: {
      info: function() {
        return {
          id: this.id,
          stripeId: this.stripeId,
          stripeKey: this.stripeKey
        };
      }
    }

  });

  return StripeManagedAccount;
};
