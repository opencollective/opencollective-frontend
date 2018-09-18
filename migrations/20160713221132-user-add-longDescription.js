'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'longDescription', {
      type: Sequelize.TEXT,
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Users', 'longDescription');
  },
};
