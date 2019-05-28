'use strict';
import { map } from 'bluebird';

const colName = 'amountType';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParams = {
      type: Sequelize.ENUM('FLEXIBLE', 'FIXED'),
    };

    return queryInterface
      .addColumn('Tiers', colName, colParams)
      .then(() => {
        return queryInterface.sequelize.query(`
          UPDATE "Tiers"
            SET "amountType" = 'FIXED'
          WHERE "presets" IS NULL
        `);
      })
      .then(() => {
        return queryInterface.sequelize.query(`
          UPDATE "Tiers"
            SET "amountType" = 'FLEXIBLE'
          WHERE "presets" IS NOT NULL
        `);
      })
      .then(() => {
        console.log('>>> Done!');
      })
      .catch(async err => {
        // Remove the table if any error occur in the process
        // to prevent having inconsistent data
        await queryInterface.removeColumn('Tiers', colName);
        throw err;
      });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tiers', colName);
  },
};
