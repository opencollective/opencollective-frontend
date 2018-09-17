'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Donations', 'notes', {
      type: Sequelize.TEXT,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Donations', 'notes');
  },
};
