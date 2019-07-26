'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colParams = {
      type: Sequelize.ENUM('RECEIPT', 'INVOICE', 'UNCLASSIFIED'),
      defaultValue: 'UNCLASSIFIED',
    };
    await queryInterface.addColumn('Expenses', 'type', colParams);
    await queryInterface.addColumn('ExpenseHistories', 'type', colParams);
    await queryInterface.sequelize.query(`
        UPDATE "Expenses"
          SET "type" = 'UNCLASSIFIED'
        WHERE "type" IS NULL
      `);
    await queryInterface.sequelize.query(`
        UPDATE "ExpenseHistories"
          SET "type" = 'UNCLASSIFIED'
        WHERE "type" IS NULL
      `);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Expenses', 'type');
    await queryInterface.removeColumn('ExpenseHistories', 'type');
    await queryInterface.sequelize.query('DROP TYPE "enum_Expenses_type";');
    await queryInterface.sequelize.query('DROP TYPE "enum_ExpenseHistories_type";');
  },
};
