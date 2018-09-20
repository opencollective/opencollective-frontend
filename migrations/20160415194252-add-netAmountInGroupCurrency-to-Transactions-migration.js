'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'Transactions',
      'netAmountInGroupCurrency',
      { type: Sequelize.INTEGER },
    );
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn(
      'Transactions',
      'netAmountInGroupCurrency',
    );
  },
};
