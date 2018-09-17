'use strict';

module.exports = {
  up: function(queryInterface) {
    return queryInterface
      .renameTable('Cards', 'PaymentMethods')
      .then(() => queryInterface.removeColumn('PaymentMethods', 'GroupId'))
      .then(() =>
        queryInterface.renameColumn(
          'Transactions',
          'paymentMethod',
          'payoutMethod',
        ),
      )
      .then(() =>
        queryInterface.renameColumn(
          'PaymentMethods',
          'serviceId',
          'customerId',
        ),
      );
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('PaymentMethods', 'GroupId', {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Groups' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
      .then(() =>
        queryInterface.renameColumn(
          'PaymentMethods',
          'customerId',
          'serviceId',
        ),
      )
      .then(() => queryInterface.renameTable('PaymentMethods', 'Cards'))
      .then(() =>
        queryInterface.renameColumn(
          'Transactions',
          'payoutMethod',
          'paymentMethod',
        ),
      );
  },
};
