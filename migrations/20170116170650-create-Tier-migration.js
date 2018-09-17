'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable(
      'Tiers',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        EventId: {
          type: DataTypes.INTEGER,
          references: {
            model: 'Events',
            key: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        name: DataTypes.STRING,

        description: DataTypes.STRING,

        amount: {
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
          min: 0,
        },

        password: {
          type: DataTypes.STRING,
        },

        startsAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },

        endsAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
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
    return queryInterface.dropTable('Tiers');
  },
};
