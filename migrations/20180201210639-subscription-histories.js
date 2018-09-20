'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('SubscriptionHistories', {
      id: DataTypes.INTEGER,
      amount: DataTypes.INTEGER,
      currency: DataTypes.STRING(3),
      interval: DataTypes.STRING(8),
      isActive: DataTypes.BOOLEAN,
      data: DataTypes.JSON,
      stripeSubscriptionId: DataTypes.STRING,
      nextChargeDate: DataTypes.DATE,
      nextPeriodStart: DataTypes.DATE,
      chargeRetryCount: DataTypes.INTEGER,
      activatedAt: DataTypes.DATE,
      deactivatedAt: DataTypes.DATE,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
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
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('SubscriptionHistories');
  },
};
