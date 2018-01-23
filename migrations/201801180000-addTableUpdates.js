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
      
      TierId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Tiers',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true
      },
      
      slug: DataTypes.STRING,
  
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
  
      LastEditedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true
      },
  
      title: DataTypes.STRING,        
      html: DataTypes.TEXT,
      image: DataTypes.STRING,
      tags: DataTypes.ARRAY(DataTypes.STRING),
  
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
  
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
  
      publishedAt: {
        type: DataTypes.DATE
      },
  
      deletedAt: {
        type: DataTypes.DATE
      }  
    };
    
    const updateHistoriesAttributes = {
      id: DataTypes.INTEGER,
      hid: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        unique: true
      },
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }  
    };

    return queryInterface.createTable('Updates', updateAttributes, { paranoid: true })
      .then(() => queryInterface.addIndex('Updates', ['CollectiveId', 'publishedAt'], {
        indexName: `Updates_CollectiveId_publishedAt`
      }))
      .then(() => queryInterface.addIndex('Updates', ['CollectiveId', 'slug'], {
        indexName: `Updates_CollectiveId_slug`,
        indicesType: 'UNIQUE'
      }))
      .then(() => queryInterface.createTable('UpdateHistories', {
        ...updateAttributes,
        ...updateHistoriesAttributes
      }));
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Updates')
      .then(() => queryInterface.dropTable('UpdateHistories'));
  }
};
