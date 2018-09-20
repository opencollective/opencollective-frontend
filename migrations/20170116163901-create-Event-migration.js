'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable(
      'Events',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        name: DataTypes.STRING,
        description: DataTypes.TEXT,

        createdByUserId: {
          type: DataTypes.INTEGER,
          references: {
            model: 'Users',
            key: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        GroupId: {
          type: DataTypes.INTEGER,
          references: {
            model: 'Groups',
            key: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        slug: DataTypes.STRING,

        locationString: DataTypes.STRING,

        startsAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },

        endsAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },

        maxAmount: {
          type: DataTypes.INTEGER, // In cents
          min: 0,
        },

        currency: {
          type: DataTypes.STRING,
          defaultValue: 'USD',
          set(val) {
            if (val && val.toUpperCase) {
              this.setDataValue('currency', val.toUpperCase());
            }
          },
        },

        quantity: {
          type: DataTypes.INTEGER,
        },

        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },

        updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },

        deletedAt: {
          type: DataTypes.DATE,
        },
      },
      {
        paranoid: true,
      },
    );
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('Events');
  },
};
