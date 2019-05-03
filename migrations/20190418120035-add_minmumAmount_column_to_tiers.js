'use strict';
import { map } from 'bluebird';
const colName = 'minimumAmount';

/**
 * Add a `minimumAmount` column to tiers to remove ambiguity.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParams = {
      type: Sequelize.INTEGER,
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
          const amount = tier.amount;
          let minimumAmount = null;
          if (presets && presets.length > 0 && amount) {
            minimumAmount = Math.min(amount, ...presets);
          } else if (presets && presets.length > 0 && !amount) {
            minimumAmount = Math.min(...presets);
          } else if (amount) {
            minimumAmount = amount;
          }

          return queryInterface.sequelize.query(
            `
          UPDATE "Tiers"
            SET "minimumAmount" = :minimumAmount
          WHERE "id" = :tierId
        `,
            {
              replacements: {
                minimumAmount,
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

  down: async queryInterface => {
    await queryInterface.removeColumn('Tiers', colName);
  },
};
