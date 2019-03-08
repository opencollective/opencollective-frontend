'use strict';

const colName = 'archivedAt';

/**
 * Add a `archivedAt` column to collectives.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParams = { type: Sequelize.DATE };
    await queryInterface.addColumn('Collectives', colName, colParams);
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Collectives', colName);
  },
};
