'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('ApplicationGroup', {
      // Dates.
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      GroupId: {
        type: DataTypes.INTEGER,
        references: 'Groups',
        referencesKey: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
        primaryKey: true,
      },
      ApplicationId: {
        type: DataTypes.INTEGER,
        references: 'Applications',
        referencesKey: 'id',
        allowNull: false,
        primaryKey: true,
      },
    });
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('ApplicationGroup');
  }
};
