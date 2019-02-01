'use strict';

const colName = 'taxAmount';

/**
 * Add a `taxAmount` column to Transactions / Orders that will be used to store
 * possibly applied VAT (for Europe) or any local tax that may be applied to
 * a transaction.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParams = { type: Sequelize.INTEGER };
    await queryInterface.addColumn('Transactions', colName, colParams);
    await queryInterface.addColumn('Orders', colName, colParams);
    await queryInterface.addColumn('OrderHistories', colName, colParams);
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Transactions', colName);
    await queryInterface.removeColumn('Orders', colName);
    await queryInterface.removeColumn('OrderHistories', colName);
  },
};
