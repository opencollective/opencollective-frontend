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
      },
    },

  });

  return StripeManagedAccount;
};
