'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Transactions', 'fxCurrency', {
      type: Sequelize.STRING
    })
    .then(() => queryInterface.addColumn('Transactions', 'fxRate', {
      type: Sequelize.FLOAT
    }))
    .then(() => queryInterface.addColumn('Transactions', 'fxAmount', {
      type: Sequelize.INTEGER
    }))
    .then(() => queryInterface.renameColumn('Transactions', 'platformFee', 'fxPlatformFee'))
    .then(() => queryInterface.renameColumn('Transactions', 'hostFee', 'fxHostFee'))
    .then(() => queryInterface.renameColumn('Transactions', 'paymentProcessingFee', 'fxPaymentProcessorFee'));
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Transactions', 'fxCurrency')
    .then(() => queryInterface.removeColumn('Transactions', 'fxRate'))
    .then(() => queryInterface.removeColumn('Transactions', 'fxAmount'))
    .then(() => queryInterface.renameColumn('Transactions', 'fxPlatformFee', 'platformFee'))
    .then(() => queryInterface.renameColumn('Transactions', 'fxHostFee', 'hostFee'))
    .then(() => queryInterface.renameColumn('Transactions', 'fxPaymentProcessorFee', 'paymentProcessingFee'));
  }
};
