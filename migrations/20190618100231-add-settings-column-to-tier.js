'use strict';

const colName = 'settings';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const colParams = {
      type: Sequelize.JSON,
    };
    return queryInterface.addColumn('Tiers', colName, colParams);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Tiers', colName);
  },
};
