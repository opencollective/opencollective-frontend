'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('Transactions', 'SubscriptionId', {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Subscriptions' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
      .then(() => {
        return queryInterface.removeColumn(
          'Transactions',
          'isWaitingFirstInvoice',
        );
      });
  },

  down: function(queryInterface) {
    return queryInterface
      .removeColumn('Transactions', 'SubscriptionId')
      .then(() => {
        return queryInterface.addColumn(
          'Transactions',
          'isWaitingFirstInvoice',
          {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
        );
      });
  },
};
