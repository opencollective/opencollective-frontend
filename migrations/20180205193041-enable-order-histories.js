'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('OrderHistories', {
      id: DataTypes.INTEGER,
      CreatedByUserId: DataTypes.INTEGER,
      FromCollectiveId: DataTypes.INTEGER,
      CollectiveId: DataTypes.INTEGER,
      TierId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      currency: DataTypes.STRING(3),
      totalAmount: DataTypes.INTEGER,
      description: DataTypes.STRING,
      publicMessage: DataTypes.STRING,
      privateMessage: DataTypes.STRING,
      SubscriptionId: DataTypes.INTEGER,
      PaymentMethodId: DataTypes.INTEGER,
      MatchingPaymentMethodId: DataTypes.INTEGER,
      ReferralCollectiveId: DataTypes.INTEGER,
      processedAt: DataTypes.DATE,
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
    return queryInterface.dropTable('OrderHistories');
  },
};
