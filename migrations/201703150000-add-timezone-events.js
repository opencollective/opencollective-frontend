'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Events', 'timezone', {
      type: Sequelize.TEXT,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Events', 'timezone');
  },
};
