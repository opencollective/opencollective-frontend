'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable('Subscriptions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      amount: DataTypes.FLOAT,

      currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
      },

      interval: DataTypes.STRING,

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      data: DataTypes.JSON,

      stripeSubscriptionId: DataTypes.STRING,

      activatedAt: DataTypes.DATE,

      deactivatedAt: DataTypes.DATE,

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
    return queryInterface.dropTable('Subscriptions');
  },
};
