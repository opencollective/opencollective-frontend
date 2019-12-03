'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    // Create the Conversations table
    await queryInterface.createTable('Conversations', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: false },
      summary: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
      deletedAt: { type: DataTypes.DATE },
      tags: DataTypes.ARRAY(DataTypes.STRING),
      CollectiveId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Users' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      FromCollectiveId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      RootCommentId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Comments' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    });

    // Link Comments to Conversations
    const commentConversationIdSettings = {
      type: DataTypes.INTEGER,
      references: { key: 'id', model: 'Conversations' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      allowNull: true,
    };
    await queryInterface.addColumn('Comments', 'ConversationId', commentConversationIdSettings);
    await queryInterface.addColumn('CommentHistories', 'ConversationId', commentConversationIdSettings);
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('Comments', 'ConversationId');
    await queryInterface.removeColumn('CommentHistories', 'ConversationId');
    await queryInterface.dropTable('Conversations');
  },
};
