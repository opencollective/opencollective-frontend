'use strict';

const colName = 'longDescription';

/**
 * Add a `longDescription` column to tiers with markdown formatting.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tiers', colName, { type: Sequelize.TEXT });
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Tiers', colName);
  },
};
