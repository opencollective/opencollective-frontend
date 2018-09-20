'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Transactions', 'DonationId', {
        type: Sequelize.INTEGER,
        references: { key: 'id', model: 'Donations' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
      .then(() =>
        queryInterface.addColumn(
          'Transactions',
          'platformFee',
          Sequelize.INTEGER,
        ),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'hostFee', Sequelize.INTEGER),
      )
      .then(() =>
        queryInterface.addColumn(
          'Transactions',
          'paymentProcessingFee',
          Sequelize.INTEGER,
        ),
      );
  },

  down: function(queryInterface) {
    return queryInterface
      .removeColumn('Transactions', 'DonationId')
      .then(() => queryInterface.removeColumn('Transactions', 'platformFee'))
      .then(() => queryInterface.removeColumn('Transactions', 'hostFee'))
      .then(() =>
        queryInterface.removeColumn('Transactions', 'paymentProcessingFee'),
      );
  },
};
