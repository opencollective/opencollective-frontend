'use strict';

const colName = 'customFields';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const colParams = {
      type: Sequelize.ARRAY(Sequelize.JSON),
    };
    return queryInterface.addColumn('Tiers', colName, colParams);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Tiers', colName);
  },
};
