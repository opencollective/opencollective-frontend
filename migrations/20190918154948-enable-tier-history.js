'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('TierHistories', {
      id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      amount: DataTypes.INTEGER,
      currency: DataTypes.STRING,
      maxQuantity: DataTypes.INTEGER,
      password: DataTypes.STRING,
      startsAt: DataTypes.DATE,
      endsAt: DataTypes.DATE,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
      slug: DataTypes.STRING,
      maxQuantityPerUser: DataTypes.INTEGER,
      goal: DataTypes.INTEGER,
      type: DataTypes.STRING,
      CollectiveId: DataTypes.INTEGER,
      interval: DataTypes.STRING(8),
      button: DataTypes.STRING,
      presets: DataTypes.ARRAY(DataTypes.INTEGER),
      minimumAmount: DataTypes.INTEGER,
      longDescription: DataTypes.TEXT,
      amountType: DataTypes.ENUM('FLEXIBLE', 'FIXED'),
      videoUrl: DataTypes.STRING,
      customFields: DataTypes.JSON,
      data: DataTypes.JSON,
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

  down: queryInterface => {
    return queryInterface.dropTable('TierHistories');
  },
};
