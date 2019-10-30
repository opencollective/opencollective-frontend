'use strict';

const colName = 'batch';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('PaymentMethods', colName, {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('PaymentMethods', colName);
  },
};
