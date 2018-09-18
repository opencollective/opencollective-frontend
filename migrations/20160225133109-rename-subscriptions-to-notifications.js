'use strict';

module.exports = {
  up: function(queryInterface) {
    return queryInterface.renameTable('Subscriptions', 'Notifications');
  },

  down: function(queryInterface) {
    return queryInterface.renameTable('Notifications', 'Subscriptions');
  },
};
