'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Expenses', 'type', {
        type: Sequelize.ENUM('RECEIPT', 'INVOICE', 'UNCLASSIFIED'),
        defaultValue: 'UNCLASSIFIED',
      }),
      queryInterface.sequelize.query(`
        UPDATE "Expenses"
          SET "type" = 'UNCLASSIFIED'
        WHERE "type" IS NULL
      `),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Expenses', 'type'),
      queryInterface.sequelize.query('DROP TYPE "enum_Expenses_type";'),
    ]);
  },
};
