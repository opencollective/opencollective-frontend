'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "Tiers" SET "minimumAmount" = NULL, "presets" = NULL WHERE "amountType" = 'FIXED'`,
    );
  },

  down: async queryInterface => {},
};
