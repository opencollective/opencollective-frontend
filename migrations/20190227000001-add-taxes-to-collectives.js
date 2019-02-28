'use strict';

const colName = 'taxes';

/**
 * Add a `taxes` column to collectives, meant to be used only for hosts.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParams = { type: Sequelize.JSON };
    await queryInterface.addColumn('Collectives', colName, colParams);
    await queryInterface.addColumn('CollectiveHistories', colName, colParams);
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Collectives', colName);
    await queryInterface.removeColumn('CollectiveHistories', colName);
  },
};
