'use strict';

const size = 2;

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Collectives', 'countryISO', Sequelize.STRING(size)).then(() => {
      queryInterface.addColumn('CollectiveHistories', 'countryISO', Sequelize.STRING(size));
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Collectives', 'countryISO').then(() => {
      queryInterface.removeColumn('CollectiveHistories', 'countryISO');
    });
  },
};
