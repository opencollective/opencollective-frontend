'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable('Groups', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: DataTypes.STRING,

      budget: DataTypes.FLOAT,
      currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
      },

      membership_type: DataTypes.ENUM('donation', 'monthlyfee', 'yearlyfee'),
      membershipfee: DataTypes.FLOAT,

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
      StripeManagedAccountId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'StripeManagedAccounts' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
    });
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('Groups');
  },
};
