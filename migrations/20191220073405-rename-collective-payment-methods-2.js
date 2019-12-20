'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "PaymentMethods" as pm
      SET "name" = CONCAT(c."name", ' (', INITCAP(LOWER(c."type")), ')')
      FROM "Collectives" AS c
      WHERE pm."service" = 'opencollective' AND pm."type" = 'collective'
      AND pm."CollectiveId" = c."id"
      AND c."type" IN ('COLLECTIVE', 'EVENT')
    `);
    await queryInterface.sequelize.query(`
      UPDATE "PaymentMethods" as pm
      SET "name" = CONCAT(c."name", ' (Host)')
      FROM "Collectives" AS c
      WHERE pm."service" = 'opencollective' AND pm."type" = 'collective'
      AND pm."CollectiveId" = c."id"
      AND c."type" IN ('ORGANIZATION', 'USER')
    `);
  },

  down: (queryInterface, Sequelize) => {},
};
