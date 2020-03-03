'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "Collectives"
      SET "HostCollectiveId" = NULL
      WHERE "deactivatedAt" IS NOT NULL`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM "Members"
      USING "Collectives"
      WHERE "Members"."CollectiveId" = "Collectives"."id"
      AND "Members"."role" = 'HOST'
      AND "Collectives"."deactivatedAt" IS NOT NULL`,
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Can't undo this without loosing data
  },
};
