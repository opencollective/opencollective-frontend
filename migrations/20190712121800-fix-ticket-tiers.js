'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "Tiers"
       SET "type" = 'TIER'
       FROM "Collectives"
       WHERE "Tiers"."type" = 'TICKET'
       AND "Tiers"."CollectiveId" = "Collectives"."id"
       AND "Collectives"."type" != 'EVENT'`,
    );
  },

  down: (queryInterface, Sequelize) => {},
};
