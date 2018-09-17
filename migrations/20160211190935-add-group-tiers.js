'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Groups', 'tiers', {
      type: DataTypes.JSON,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Groups', 'tiers');
  },
};
