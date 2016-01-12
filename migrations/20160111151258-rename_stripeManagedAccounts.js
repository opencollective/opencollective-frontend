'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .renameTable('StripeManagedAccounts', 'StripeAccounts');
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface
      .renameTable('StripeAccounts', 'StripeManagedAccounts');
  }
};
