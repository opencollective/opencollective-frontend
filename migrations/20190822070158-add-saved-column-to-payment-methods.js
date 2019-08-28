'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('PaymentMethods', 'saved', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.sequelize.query(`
      UPDATE "PaymentMethods"
      SET "saved" = TRUE
      WHERE "CollectiveId" IS NOT NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('PaymentMethods', 'saved');
  },
};
