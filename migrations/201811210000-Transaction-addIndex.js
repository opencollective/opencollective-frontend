'use strict';

module.exports = {
  up: function(queryInterface) {
    return queryInterface.addIndex(
      'Transactions',
      ['PaymentMethodId', 'type', 'deletedAt'],
      {
        indexName: 'PaymentMethodId-type',
        indicesType: 'INDEX',
      },
    );
  },

  down: function(queryInterface) {
    return queryInterface.removeIndex('Transactions', 'PaymentMethodId');
  },
};
