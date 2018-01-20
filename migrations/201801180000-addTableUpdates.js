'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable(
      'Updates', {
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
        text: DataTypes.TEXT,
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
      }, {
        paranoid: true
      })
      .then(() => queryInterface.addIndex('Updates', ['CollectiveId', 'publishedAt'], {
        indexName: 'CollectiveId_publishedAt'
      }))
      .then(() => queryInterface.addIndex('Updates', ['CollectiveId', 'slug'], {
        indexName: 'CollectiveId_slug',
        indicesType: 'UNIQUE'
      }));
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Updates');
  }
};
