'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('Updates', 'makePublicOn', {
        type: Sequelize.DATE,
        defaultValue: null,
      })
      .then(() => {
        return queryInterface.addColumn('UpdateHistories', 'makePublicOn', {
          type: Sequelize.DATE,
          defaultValue: null,
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Updates', 'makePublicOn').then(() => {
      queryInterface.removeColumn('UpdateHistories', 'makePublicOn');
    });
  },
};
