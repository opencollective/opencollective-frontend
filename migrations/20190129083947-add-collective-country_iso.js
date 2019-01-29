'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Collectives', 'countryISO', Sequelize.STRING).then(() => {
      queryInterface.addColumn('CollectiveHistories', 'countryISO', Sequelize.STRING);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Collectives', 'countryISO').then(() => {
      queryInterface.removeColumn('CollectiveHistories', 'countryISO');
    });
  },
};
