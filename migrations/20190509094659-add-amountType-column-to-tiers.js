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
          SELECT * FROM "Tiers"
        `);
      })
      .then(results => {
        const tiers = results[0];
        return map(tiers, tier => {
          const presets = tier.presets;
          let amountType;
          if (presets) {
            amountType = 'FLEXIBLE';
          } else {
            amountType = 'FIXED';
          }
          return queryInterface.sequelize.query(
            `
              UPDATE "Tiers"
                SET "amountType" = :amountType
              WHERE "id" = :tierId
            `,
            {
              replacements: {
                amountType,
                tierId: tier.id,
              },
            },
          );
        });
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
