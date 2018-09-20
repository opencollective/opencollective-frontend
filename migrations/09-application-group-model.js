'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
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
        references: { key: 'id', model: 'Groups' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
        primaryKey: true,
      },
      ApplicationId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Applications' },
        allowNull: false,
        primaryKey: true,
      },
    });
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('ApplicationGroup');
  },
};
