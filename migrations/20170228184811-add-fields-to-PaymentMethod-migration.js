'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('PaymentMethods', 'expiryDate', {
      type: Sequelize.DATE,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('PaymentMethods', 'expiryDate');
  },
};
