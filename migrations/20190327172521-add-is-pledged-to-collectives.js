'use strict';

const colName = 'isPledged';

/**
 * Add a `isPledged` column to colectives to remove ambiguity.
 *
 * See https://github.com/opencollective/opencollective/issues/1842
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParams = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false };
    await queryInterface.addColumn('Collectives', colName, colParams);
    await queryInterface.addColumn('CollectiveHistories', colName, colParams);
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Collectives', colName);
    await queryInterface.removeColumn('CollectiveHistories', colName);
  },
};
