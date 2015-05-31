'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('StripeManagedAccounts', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      stripeId: DataTypes.STRING,
      stripeSecret: DataTypes.STRING,
      stripeKey: DataTypes.STRING,
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
    }).then(function() {
      return queryInterface.addColumn('Groups', 'StripeManagedAccountId', {
        type: DataTypes.INTEGER,
        references: 'StripeManagedAccounts',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    });
  },
  down: function (queryInterface) {
    return queryInterface.removeColumn('Groups', 'StripeManagedAccountId')
      .then(function () {
        queryInterface.dropTable('StripeManagedAccounts');
      });
  }
};
