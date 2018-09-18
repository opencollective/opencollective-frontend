'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('Transactions', 'paidby')
      .then(() => queryInterface.removeColumn('Transactions', 'status'))
      .then(() => queryInterface.removeColumn('Transactions', 'comment'))
      .then(() => queryInterface.removeColumn('Transactions', 'approved'))
      .then(() => queryInterface.removeColumn('Transactions', 'approvedAt'))
      .then(() =>
        queryInterface.removeColumn('Transactions', 'stripeSubscriptionId'),
      )
      .then(() => queryInterface.removeColumn('Transactions', 'payoutMethod'))
      .then(() => queryInterface.removeColumn('Transactions', 'vat'))
      .then(() => queryInterface.removeColumn('Transactions', 'interval'))
      .then(() => queryInterface.removeColumn('Transactions', 'vendor'))
      .then(() => queryInterface.removeColumn('Transactions', 'SubscriptionId'))
      .then(() => queryInterface.removeColumn('Transactions', 'tags'))
      .then(() => queryInterface.removeColumn('Transactions', 'link'))
      .then(() => queryInterface.removeColumn('Transactions', 'reimbursedAt'));
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Transactions', 'paidby', {
        type: Sequelize.STRING,
      })
      .then(() =>
        queryInterface.addColumn('Transactions', 'status', {
          type: Sequelize.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'comment', {
          type: Sequelize.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'approved', {
          type: Sequelize.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'approvedAt', {
          type: Sequelize.DATE,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'stripeSubscriptionId', {
          type: Sequelize.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'payoutMethod', {
          type: Sequelize.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'vat', {
          type: Sequelize.FLOAT,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'interval', {
          type: Sequelize.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'vendor', {
          type: Sequelize.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'SubscriptionId', {
          type: Sequelize.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'tags', {
          type: Sequelize.ARRAY(Sequelize.STRING),
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'link', {
          type: Sequelize.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'reimbursedAt', {
          type: Sequelize.DATE,
        }),
      );
  },
};
