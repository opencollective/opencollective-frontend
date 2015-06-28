'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('Paykeys', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      trackingId: DataTypes.STRING,
      paykey: DataTypes.STRING,
      status: DataTypes.STRING,
      payload: DataTypes.JSON,
      data: DataTypes.JSON,
      error: DataTypes.JSON,
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
      },
      TransactionId: {
        type: DataTypes.INTEGER,
        references: 'Transactions',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }
    });
  },
  down: function (queryInterface) {
    return queryInterface.dropTable('Paykeys');
  }
};
