'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    // Create the ConversationFollowers table
    await queryInterface.createTable(
      'ConversationFollowers',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        UserId: {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'Users' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          allowNull: false,
        },

        ConversationId: {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'Conversations' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          allowNull: false,
        },

        // Using a dedicated column rather than deleting the follower in case the user is following
        // all the conversations for a Collective and wants to opt-out from one of them.
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false,
        },

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
      },
      {
        uniqueKeys: {
          uniqueUserConversation: {
            customIndex: true,
            fields: ['UserId', 'ConversationId'],
          },
        },
      },
    );
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.dropTable('ConversationFollowers');
  },
};
