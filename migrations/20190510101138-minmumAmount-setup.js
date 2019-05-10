'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `
      UPDATE "Tiers"
        SET "minimumAmount" = NULL
      WHERE "presets" IS NULL
    `,
    );
  },

  down: async (queryInterface, Sequelize) => {},
};
