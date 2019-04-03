'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Notifications', 'deletedAt', {
      type: DataTypes.DATE,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Notifications', 'deletedAt');
  },
};
