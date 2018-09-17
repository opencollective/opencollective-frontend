'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    const commentAttributes = {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      CollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      FromCollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      ExpenseId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Expenses',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },

      UpdateId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Updates',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },

      markdown: DataTypes.TEXT,
      html: DataTypes.TEXT,

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
    };

    const commentHistoriesAttributes = {
      id: DataTypes.INTEGER,
      hid: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    };
    return queryInterface
      .createTable('Comments', commentAttributes, { paranoid: true })
      .then(() =>
        queryInterface.addIndex('Comments', ['ExpenseId', 'createdAt'], {
          indexName: `Comments_ExpenseId_createdAt`,
        }),
      )
      .then(() =>
        queryInterface.addIndex('Comments', ['UpdateId', 'createdAt'], {
          indexName: `Comments_UpdateId_createdAt`,
        }),
      )
      .then(() =>
        queryInterface.createTable('CommentHistories', {
          ...commentAttributes,
          ...commentHistoriesAttributes,
        }),
      );
  },

  down: function(queryInterface) {
    return queryInterface
      .dropTable('Comments')
      .then(() => queryInterface.dropTable('CommmentHistories'));
  },
};
