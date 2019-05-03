'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .createTable('Subscriptions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        channel: {
          defaultValue: 'email',
          type: Sequelize.STRING,
        },

        type: Sequelize.STRING,

        active: { defaultValue: true, type: Sequelize.BOOLEAN },

        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },

        updatedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
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
      })
      .then(() => {
        return queryInterface.addIndex('Subscriptions', ['type', 'GroupId', 'UserId'], { indicesType: 'UNIQUE' });
      });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('Subscriptions');
  },
};
