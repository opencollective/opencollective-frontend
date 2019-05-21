'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('Updates', 'isPrivate', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      })
      .then(() => {
        return queryInterface.addColumn('UpdateHistories', 'isPrivate', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Updates', 'isPrivate').then(() => {
      queryInterface.removeColumn('UpdateHistories', 'isPrivate');
    });
  },
};
