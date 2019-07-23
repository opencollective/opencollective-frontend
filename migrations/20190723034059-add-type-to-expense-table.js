'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Expenses', 'type', {
      type: Sequelize.STRING(),
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Expenses', 'type');
  },
};
