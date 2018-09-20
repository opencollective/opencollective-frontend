'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .removeColumn('Groups', 'StripeManagedAccountId')
      .then(function() {
        return queryInterface.dropTable('StripeManagedAccounts');
      })
      .then(function() {
        return queryInterface.createTable('StripeAccounts', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          accessToken: DataTypes.STRING,
          refreshToken: DataTypes.STRING,
          tokenType: DataTypes.STRING,
          stripePublishableKey: DataTypes.STRING,
          stripeUserId: DataTypes.STRING,
          scope: DataTypes.STRING,

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
        });
      })
      .then(function() {
        return queryInterface.addColumn('UserGroups', 'StripeAccountId', {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'StripeAccounts' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      });
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface
      .removeColumn('UserGroups', 'StripeAccountId')
      .then(function() {
        return queryInterface.dropTable('StripeAccounts');
      })
      .then(function() {
        return queryInterface.createTable('StripeManagedAccounts', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },

          stripeId: DataTypes.STRING,
          stripeSecret: DataTypes.STRING,
          stripeKey: DataTypes.STRING,

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
        });
      })
      .then(function() {
        return queryInterface.addColumn('Groups', 'StripeManagedAccountId', {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'StripeManagedAccounts' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      });
  },
};
