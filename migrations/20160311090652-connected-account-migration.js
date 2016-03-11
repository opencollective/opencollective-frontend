'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    queryInterface.createTable('ConnectedAccounts',{
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      provider: DataTypes.STRING,

      username: DataTypes.STRING,

      clientId: DataTypes.STRING,

      secret: DataTypes.STRING,

      data: DataTypes.JSON,

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },

      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },

      deletedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
     })
     .then(() => {
      return queryInterface.addColumn('Users', 'ConnectedAccountId', {
        type: DataTypes.INTEGER,
        references: 'ConnectedAccounts',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    });
  },

  down: function (queryInterface, DataTypes) {
    return queryInterface.removeColumn('Users', 'ConnectedAccountId')
      .then(() => queryInterface.dropTable('ConnectedAccounts'));
  }
};
