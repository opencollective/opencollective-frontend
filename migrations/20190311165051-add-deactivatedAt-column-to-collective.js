'use strict';

const colName = 'deactivatedAt';

/**
 * Add a `archivedAt` column to collectives.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParams = { type: Sequelize.DATE };
    await queryInterface.addColumn('Collectives', colName, colParams);
    await queryInterface.addColumn('CollectiveHistories', colName, colParams);
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Collectives', colName);
    await queryInterface.removeColumn('CollectiveHistories', colName);
  },
};
