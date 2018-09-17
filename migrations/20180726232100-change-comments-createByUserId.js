'use strict';

module.exports = {
  up: (queryInterface, sequelize) => {
    return queryInterface.changeColumn('Comments', 'CreatedByUserId', {
      type: sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: (queryInterface, sequelize) => {
    return Promise.resolve();
  },
};
