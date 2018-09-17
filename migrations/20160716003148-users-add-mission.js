'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'mission', {
      type: Sequelize.STRING(100),
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Users', 'mission');
  },
};
