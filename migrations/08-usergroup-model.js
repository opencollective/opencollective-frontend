'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('UserGroups', {
      // Role.
      role: DataTypes.ENUM('admin', 'writer', 'viewer'),

      // Dates.
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      deletedAt: {
        type: DataTypes.DATE
      },
      UserId: {
        type: DataTypes.INTEGER,
        references: 'Users',
        referencesKey: 'id',
        primaryKey: true,
        allowNull: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      GroupId: {
        type: DataTypes.INTEGER,
        references: 'Groups',
        referencesKey: 'id',
        primaryKey: true,
        allowNull: false
      },
    });
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('UserGroups');
  }
};
