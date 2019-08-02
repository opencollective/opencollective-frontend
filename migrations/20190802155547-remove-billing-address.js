'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'billingAddress');
  },

  down: function(queryInterface) {
    return queryInterface.addColumn('Users', 'billingAddress', { type: Sequelize.STRING(255) });
  },
};
