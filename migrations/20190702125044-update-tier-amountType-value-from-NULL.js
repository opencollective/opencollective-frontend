'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "Tiers"
        SET "amountType" = 'FIXED'
      WHERE "presets" IS NULL
    `);
    await queryInterface.sequelize.query(`
      UPDATE "Tiers"
        SET "amountType" = 'FLEXIBLE'
      WHERE "presets" IS NOT NULL
    `);
  },

  down: (queryInterface, Sequelize) => {},
};
