'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.removeColumn('UserGroups', 'role', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'member'
    });
  },

  down: function (queryInterface, Sequelize) {
   return queryInterface.addColumn('UserGroups', 'role', {
      type: DataTypes.ENUM('admin', 'writer', 'viewer')
    });
  }
};
