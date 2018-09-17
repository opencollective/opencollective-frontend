'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.removeColumn('UserGroups', 'role').then(function() {
      return queryInterface.addColumn('UserGroups', 'role', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'MEMBER',
      });
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('UserGroups', 'role').then(function() {
      return queryInterface.addColumn('UserGroups', 'role', {
        type: DataTypes.ENUM('admin', 'writer', 'viewer'),
      });
    });
  },
};
