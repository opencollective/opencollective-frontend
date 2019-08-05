'use strict';

const colName = 'approvedAt';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParms = {
      type: Sequelize.DATE,
    };
    await queryInterface.addColumn('Collectives', colName, colParms);
    await queryInterface.addColumn('CollectiveHistories', colName, colParms);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Collectives', colName);
    await queryInterface.removeColumn('CollectiveHistories', colName);
  },
};
