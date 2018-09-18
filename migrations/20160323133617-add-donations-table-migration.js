'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable(
      'Donations',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        UserId: {
          type: Sequelize.INTEGER,
          references: { key: 'id', model: 'Users' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        GroupId: {
          type: Sequelize.INTEGER,
          references: { key: 'id', model: 'Groups' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        currency: {
          type: Sequelize.STRING,
          defaultValue: 'USD',
          set: function(val) {
            if (val && val.toUpperCase) {
              this.setDataValue('currency', val.toUpperCase());
            }
          },
        },

        amount: Sequelize.INTEGER,
        title: Sequelize.STRING,

        SubscriptionId: {
          type: Sequelize.INTEGER,
          references: { key: 'id', model: 'Subscriptions' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },

        updatedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },

        deletedAt: {
          type: Sequelize.DATE,
        },
      },
      {
        paranoid: true,
      },
    );
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('Donations');
  },
};
