'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      UPDATE "PaymentMethods"
      SET "deletedAt" = NOW()
      WHERE "service" = 'stripe' AND "type" = 'bitcoin'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // No rollback for this one
  },
};
