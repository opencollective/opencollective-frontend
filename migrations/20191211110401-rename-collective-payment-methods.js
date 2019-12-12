'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "PaymentMethods" as pm
      SET "name" = CONCAT(c."name", ' (', INITCAP(LOWER(c."type")), ')')
      FROM "Collectives" AS c
      WHERE pm."service" = 'opencollective' AND pm."type" = 'collective'
      AND pm."CollectiveId" = c."id"
    `);
  },

  down: async (queryInterface, DataTypes) => {},
};
