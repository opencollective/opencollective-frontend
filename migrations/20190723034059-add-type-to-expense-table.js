'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Expenses', 'type', {
      type: Sequelize.ENUM('RECEIPT', 'INVOICE', 'UNCLASSIFIED'),
    });
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Expenses', 'type'),
      queryInterface.sequelize.query('DROP TYPE "enum_Expenses_type";'),
    ]);
  },
};
