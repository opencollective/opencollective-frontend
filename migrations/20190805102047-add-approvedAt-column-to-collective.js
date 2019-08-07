'use strict';

const colName = 'approvedAt';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParms = {
      type: Sequelize.DATE,
    };
    await queryInterface.addColumn('Collectives', colName, colParms);
    await queryInterface.addColumn('CollectiveHistories', colName, colParms);
    return queryInterface.sequelize.query(`
      UPDATE "Collectives" c
        SET "approvedAt" = '2019-08-06'
      WHERE c."isActive" IS TRUE
      AND c."type" = 'COLLECTIVE'
      AND c."HostCollectiveId" IS NOT NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Collectives', colName);
    await queryInterface.removeColumn('CollectiveHistories', colName);
  },
};
