'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.sequelize
      .query('update "Transactions" SET amount = amount*100')
      .then(() =>
        queryInterface.sequelize.query(
          'update "Subscriptions" SET amount = amount*100',
        ),
      )
      .then(() =>
        queryInterface.changeColumn('Transactions', 'amount', {
          type: Sequelize.INTEGER,
        }),
      )
      .then(() =>
        queryInterface.changeColumn('Subscriptions', 'amount', {
          type: Sequelize.INTEGER,
        }),
      );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .changeColumn('Transactions', 'amount', {
        type: Sequelize.FLOAT,
      })
      .then(() =>
        queryInterface.changeColumn('Subscriptions', 'amount', {
          type: Sequelize.FLOAT,
        }),
      )
      .then(() =>
        queryInterface.sequelize.query(
          'update "Transactions" SET amount = amount/100',
        ),
      )
      .then(() =>
        queryInterface.sequelize.query(
          'update "Subscriptions" SET amount = amount/100',
        ),
      );
  },
};
