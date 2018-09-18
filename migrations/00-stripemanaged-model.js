'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
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
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('StripeManagedAccounts');
  },
};
