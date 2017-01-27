'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('update "Transactions" SET amount = amount*100')
      .then(() => queryInterface.sequelize.query('update "Subscriptions" SET amount = amount*100'))
      .then(() => queryInterface.changeColumn('Transactions', 'amount', {
        Sequelize.INTEGER
      }))
      .then(() => queryInterface.changeColumn('Subscriptions', 'amount', {
        Sequelize.INTEGER
      }))
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Transactions', 'amount', {
        Sequelize.FLOAT
      }))
      .then(() => queryInterface.changeColumn('Subscriptions', 'amount', {
        Sequelize.FLOAT
      }))
      .then(() => queryInterface.sequelize.query('update "Transactions" SET amount = amount/100')
      .then(() => queryInterface.sequelize.query('update "Subscriptions" SET amount = amount/100'))
  }
};
