'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable('ExpenseHistories', {
      id: DataTypes.INTEGER,
      UserId: DataTypes.INTEGER,

      GroupId: DataTypes.INTEGER,
      currency: DataTypes.STRING,
      amount: DataTypes.INTEGER,
      title: DataTypes.STRING,
      payoutMethod: DataTypes.STRING,
      notes: DataTypes.TEXT,
      attachment: DataTypes.STRING,
      category: DataTypes.STRING,
      vat: DataTypes.INTEGER,
      lastEditedById: DataTypes.INTEGER,
      status: DataTypes.STRING,
      incurredAt: DataTypes.DATE,
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

  down: function(queryInterface) {
    return queryInterface.dropTable('ExpenseHistories');
  },
};
