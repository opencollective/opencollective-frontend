'use strict';

/**
 * Add an index on `Transactions` for `UsingVirtualCardFromCollectiveId` to
 * improve performances.
 */
module.exports = {
  up: queryInterface => {
    return queryInterface.addIndex('Transactions', ['UsingVirtualCardFromCollectiveId']);
  },

  down: queryInterface => {
    return queryInterface.removeIndex('Transactions', ['UsingVirtualCardFromCollectiveId']);
  },
};
