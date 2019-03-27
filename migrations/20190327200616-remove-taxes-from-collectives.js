'use strict';

const colName = 'taxes';

/**
 * Remove taxes field created in `/home/user/Workspace/Projects/opencollective/opencollective-api/migrations/20190227000001-add-taxes-to-collectives.js`
 * This information has now been moved directly to JS code, in the
 * `@opencollective/taxes` library.
 */
module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('Collectives', colName);
    await queryInterface.removeColumn('CollectiveHistories', colName);
  },

  down: async (queryInterface, Sequelize) => {
    const colParams = { type: Sequelize.JSON };
    await queryInterface.addColumn('Collectives', colName, colParams);
    await queryInterface.addColumn('CollectiveHistories', colName, colParams);
  },
};
