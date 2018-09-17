'use strict';

module.exports = {
  up: function(queryInterface) {
    return queryInterface.renameColumn(
      'Transactions',
      'CardId',
      'PaymentMethodId',
    );
  },

  down: function(queryInterface) {
    return queryInterface.renameColumn(
      'Transactions',
      'PaymentMethodId',
      'CardId',
    );
  },
};
