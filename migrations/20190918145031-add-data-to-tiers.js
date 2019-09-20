'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Tiers', 'data', Sequelize.JSON);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Tiers', 'data');
  },
};
