'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .createTable('ConnectedAccounts', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        provider: DataTypes.STRING,

        username: DataTypes.STRING,

        clientId: DataTypes.STRING,

        secret: DataTypes.STRING,

        data: DataTypes.JSON,

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
          defaultValue: DataTypes.NOW,
        },
      })
      .then(() => {
        return queryInterface.addColumn('ConnectedAccounts', 'UserId', {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'Users' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      });
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface
      .removeColumn('ConnectedAccounts', 'UserId')
      .then(() => queryInterface.dropTable('ConnectedAccounts'));
  },
};
