'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable('Transactions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: DataTypes.STRING,
      description: DataTypes.STRING,
      amount: DataTypes.FLOAT,
      currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
      },
      beneficiary: DataTypes.STRING,
      paidby: DataTypes.STRING,
      tags: DataTypes.ARRAY(DataTypes.STRING),
      status: DataTypes.STRING,
      comment: DataTypes.STRING,
      link: DataTypes.STRING,

      approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      approvedAt: DataTypes.DATE,
      reimbursedAt: DataTypes.DATE,
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('Transactions');
  },
};
