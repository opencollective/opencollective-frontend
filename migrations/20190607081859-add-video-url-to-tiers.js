'use strict';

/**
 * Add a `videoUrl` column to tiers to store YouTube / Vimeo URLs.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tiers', 'videoUrl', { type: Sequelize.STRING });
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Tiers', 'videoUrl');
  },
};
