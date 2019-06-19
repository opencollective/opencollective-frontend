'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "Orders" SET "status" = 'ACTIVE'
       WHERE "status" = 'PENDING'
       AND "totalAmount" = 0
       AND "SubscriptionId" IS NOT NULL`,
    );
    await queryInterface.sequelize.query(
      `UPDATE "Orders" SET "status" = 'PAID'
       WHERE "status" = 'PENDING'
       AND "totalAmount" = 0
       AND "SubscriptionId" IS NULL`,
    );
  },

  down: (queryInterface, Sequelize) => {},
};
