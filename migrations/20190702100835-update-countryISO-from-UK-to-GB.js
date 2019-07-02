'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "Collectives"
      SET "countryISO" = 'GB'
      WHERE "countryISO" = 'UK'
    `);
  },

  down: (queryInterface, Sequelize) => {},
};
