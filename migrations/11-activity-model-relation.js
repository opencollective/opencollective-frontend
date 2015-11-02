'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Activities', 'GroupId', {
      type: DataTypes.INTEGER,
      references: 'Groups',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    })
    .then(function() {
      queryInterface.addColumn('Activities', 'UserId', {
        type: DataTypes.INTEGER,
        references: 'Users',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    })
    .then(function() {
      queryInterface.addColumn('Activities', 'TransactionId', {
        type: DataTypes.INTEGER,
        references: 'Transactions',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Activities', 'GroupId')
    .then(function() {
      return queryInterface.removeColumn('Activities', 'UserId');
    })
    .then(function() {
      return queryInterface.removeColumn('Activities', 'TransactionId');
    });
  }
};
