'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'interval', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('OrderHistories', 'interval', {
      type: Sequelize.STRING,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'interval');
    await queryInterface.removeColumn('OrderHistories', 'interval');
  },
};
