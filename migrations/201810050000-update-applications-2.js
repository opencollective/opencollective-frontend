'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('Applications', 'apiKey', {
        type: Sequelize.STRING,
      })
      .then(() => {
        console.log('>>> done');
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Applications', 'apiKey').then(() => {
      console.log('>>> done');
    });
  },
};
