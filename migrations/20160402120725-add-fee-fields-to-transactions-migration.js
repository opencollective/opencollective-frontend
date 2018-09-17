'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Transactions', 'txnCurrency', {
        type: Sequelize.STRING,
      })
      .then(() =>
        queryInterface.addColumn('Transactions', 'txnCurrencyFxRate', {
          type: Sequelize.FLOAT,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Transactions', 'amountInTxnCurrency', {
          type: Sequelize.INTEGER,
        }),
      )
      .then(() =>
        queryInterface.renameColumn(
          'Transactions',
          'platformFee',
          'platformFeeInTxnCurrency',
        ),
      )
      .then(() =>
        queryInterface.renameColumn(
          'Transactions',
          'hostFee',
          'hostFeeInTxnCurrency',
        ),
      )
      .then(() =>
        queryInterface.renameColumn(
          'Transactions',
          'paymentProcessingFee',
          'paymentProcessorFeeInTxnCurrency',
        ),
      );
  },

  down: function(queryInterface) {
    return queryInterface
      .removeColumn('Transactions', 'txnCurrency')
      .then(() =>
        queryInterface.removeColumn('Transactions', 'txnCurrencyFxRate'),
      )
      .then(() =>
        queryInterface.removeColumn('Transactions', 'amountInTxnCurrency'),
      )
      .then(() =>
        queryInterface.renameColumn(
          'Transactions',
          'platformFeeInTxnCurrency',
          'platformFee',
        ),
      )
      .then(() =>
        queryInterface.renameColumn(
          'Transactions',
          'hostFeeInTxnCurrency',
          'hostFee',
        ),
      )
      .then(() =>
        queryInterface.renameColumn(
          'Transactions',
          'paymentProcessorFeeInTxnCurrency',
          'paymentProcessingFee',
        ),
      );
  },
};
