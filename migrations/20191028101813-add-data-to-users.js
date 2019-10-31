'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'data', { type: Sequelize.JSON });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'data');
  },
};
