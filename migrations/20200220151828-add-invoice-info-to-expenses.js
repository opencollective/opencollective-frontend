'use strict';

const colName = 'invoiceInfo';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columnSettings = { type: Sequelize.TEXT, allowNull: true };
    await queryInterface.addColumn('ExpenseHistories', colName, columnSettings);
    await queryInterface.addColumn('Expenses', colName, columnSettings);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Expenses', colName);
    await queryInterface.removeColumn('ExpenseHistories', colName);
  },
};
