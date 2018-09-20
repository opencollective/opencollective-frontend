'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable(
      'Responses',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        UserId: {
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

        TierId: {
          type: DataTypes.INTEGER,
          references: {
            model: 'Tiers',
            key: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
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

        confirmedAt: {
          type: DataTypes.DATE,
        },

        status: {
          type: DataTypes.STRING,
          defaultValue: 'PENDING',
          allowNull: false,
          validate: {
            isIn: {
              args: [['PENDING', 'INTERESTED', 'YES', 'NO']],
              msg: 'Must be PENDING, INTERESTED, YES or NO',
            },
          },
        },

        quantity: {
          type: DataTypes.INTEGER,
          min: 0,
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
    return queryInterface.dropTable('Responses');
  },
};
