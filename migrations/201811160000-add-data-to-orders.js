'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('Orders', 'data', {
        type: Sequelize.JSON,
      })
      .then(() =>
        queryInterface.addColumn('OrderHistories', 'data', {
          type: Sequelize.JSON,
        }),
      )
      .then(() => {
        console.log('>>> done');
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
      .removeColumn('Orders', 'data')
      .then(() => queryInterface.removeColumn('OrderHistories', 'data'))
      .then(() => {
        console.log('>>> done');
      });
  },
};
