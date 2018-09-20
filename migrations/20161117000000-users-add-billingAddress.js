'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'billingAddress', {
      type: Sequelize.STRING(255),
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Users', 'billingAddress');
  },
};
