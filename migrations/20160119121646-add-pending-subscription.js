'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Transactions', 'isWaitingFirstInvoice', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Transactions', 'isWaitingFirstInvoice');
  },
};
