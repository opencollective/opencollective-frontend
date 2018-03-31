'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {

    const updateAttributes = {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
  
      CollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false
      },
  
      FromCollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false          
      },
  
      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false
      },
  
      ExpenseId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Expenses',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true
      },

      UpdateId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Updates',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true
      },
  
      markdown: DataTypes.TEXT,
  
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
  
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
    
      deletedAt: {
        type: DataTypes.DATE
      }  
    };

    return queryInterface.createTable('Comments', updateAttributes, { paranoid: true })
      .then(() => queryInterface.addIndex('Comments', ['ExpenseId', 'publishedAt'], {
        indexName: `Comments_ExpenseId_publishedAt`
      }))
      .then(() => queryInterface.addIndex('Comments', ['UpdateId', 'publishedAt'], {
        indexName: `Comments_UpdateId_publishedAt`
      }))
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Comments');
  }
};
