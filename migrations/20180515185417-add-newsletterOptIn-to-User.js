'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('Users', 'newsletterOptIn', {
        allowNull: false,
        defaultValue: true, // existing Users are opted in
        type: Sequelize.BOOLEAN,
      })
      .then(() => {
        console.log('>>> done');
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'newsletterOptIn');
  },
};
