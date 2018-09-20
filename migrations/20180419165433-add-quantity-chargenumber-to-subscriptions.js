'use strict';

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface
      .addColumn('Subscriptions', 'quantity', {
        type: Sequelize.INTEGER,
      })
      .then(() =>
        queryInterface.addColumn('Subscriptions', 'chargeNumber', {
          type: Sequelize.INTEGER,
        }),
      )
      .then(() =>
        queryInterface.addColumn('SubscriptionHistories', 'quantity', {
          type: Sequelize.INTEGER,
        }),
      )
      .then(() =>
        queryInterface.addColumn('SubscriptionHistories', 'chargeNumber', {
          type: Sequelize.INTEGER,
        }),
      ),

  down: (queryInterface, Sequelize) =>
    queryInterface
      .removeColumn('Subscriptions', 'quantity')
      .then(() => queryInterface.removeColumn('Subscriptions', 'chargeNumber'))
      .then(() =>
        queryInterface.removeColumn('SubscriptionHistories', 'quantity'),
      )
      .then(() =>
        queryInterface.removeColumn('SubscriptionHistories', 'chargeNumber'),
      ),
};
