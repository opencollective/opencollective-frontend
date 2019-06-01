'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      UPDATE "Collectives"
      SET "image" = REPLACE("image", 'images.githubusercontent.com', 'avatars.githubusercontent.com')
      WHERE "image" ILIKE '%images.githubusercontent.com%'
    `);
  },

  down: async (queryInterface, Sequelize) => {},
};
