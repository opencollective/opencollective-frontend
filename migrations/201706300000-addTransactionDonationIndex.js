'use strict';

module.exports = {
  up: function(queryInterface) {
    return queryInterface.addIndex('Transactions', ['DonationId'], {
      indexName: 'DonationId',
      indicesType: 'INDEX',
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeIndex('Transactions', 'DonationId');
  },
};
