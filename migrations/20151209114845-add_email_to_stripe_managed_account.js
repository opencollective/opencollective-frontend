'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('StripeManagedAccounts', 'stripeEmail', {
      type: DataTypes.STRING,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('StripeManagedAccounts', 'stripeEmail');
  },
};
