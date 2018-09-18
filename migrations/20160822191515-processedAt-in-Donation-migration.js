'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Donations', 'processedAt', {
      type: Sequelize.DATE,
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Donations', 'processedAt');
  },
};
