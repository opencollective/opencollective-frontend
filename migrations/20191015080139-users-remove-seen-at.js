'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Move all existing values for seenAt
    await queryInterface.sequelize.query(`
      UPDATE "Users" SET "lastLoginAt" = "seenAt"
      WHERE "seenAt" IS NOT NULL
      AND "lastLoginAt" IS NULL
    `);

    // Remove column
    await queryInterface.removeColumn('Users', 'seenAt');
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('Users', 'seenAt', {
      type: DataTypes.DATE,
    });
  },
};
