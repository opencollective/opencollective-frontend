'use strict';

/**
 * Updates all auto-generated descriptions for orders and transactions to replace
 * "Donation to" by "Financial contribution to".
 */
module.exports = {
  up: async queryInterface => {
    // Change all `Donation to ___` -> `Financial contribution to ___`
    await queryInterface.sequelize.query(`
      UPDATE  "Orders"
      SET     description = regexp_replace(description, '^Donation to ', 'Financial contribution to ')
      WHERE   description LIKE 'Donation to %'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Transactions"
      SET     description = regexp_replace(description, '^Donation to ', 'Financial contribution to ')
      WHERE   description LIKE 'Donation to %'
    `);

    // Change all `Monthly|Yearly donation to ___` -> `Monthly|Yearly financial contribution to ___`
    await queryInterface.sequelize.query(`
      UPDATE  "Orders"
      SET     description = regexp_replace(description, '^(Monthly|Yearly) donation to ', '\\1 financial contribution to ')
      WHERE   description LIKE 'Monthly donation to %'
      OR      description LIKE 'Yearly donation to %'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Transactions"
      SET     description = regexp_replace(description, '^(Monthly|Yearly) donation to ', '\\1 financial contribution to ')
      WHERE   description LIKE 'Monthly donation to %'
      OR      description LIKE 'Yearly donation to %'
    `);
  },

  down: async queryInterface => {
    // Change all `Financial contribution to ___` -> `Donation to ___`
    await queryInterface.sequelize.query(`
      UPDATE  "Orders"
      SET     description = regexp_replace(description, '^Financial contribution to ', 'Donation to ')
      WHERE   description LIKE 'Financial contribution to %'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Transactions"
      SET     description = regexp_replace(description, '^Financial contribution to ', 'Donation to ')
      WHERE   description LIKE 'Financial contribution to %'
    `);

    // Change all `Monthly|Yearly financial contribution to ___` -> `Monthly|Yearly donation to ___`
    await queryInterface.sequelize.query(`
      UPDATE  "Orders"
      SET     description = regexp_replace(description, '^(Monthly|Yearly) financial contribution to ', '\\1 donation to ')
      WHERE   description LIKE 'Monthly financial contribution to %'
      OR      description LIKE 'Yearly financial contribution to %'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Transactions"
      SET     description = regexp_replace(description, '^(Monthly|Yearly) financial contribution to ', '\\1 donation to ')
      WHERE   description LIKE 'Monthly financial contribution to %'
      OR      description LIKE 'Yearly financial contribution to %'
    `);
  },
};
