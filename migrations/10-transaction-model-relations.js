'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Transactions', 'GroupId', {
      type: DataTypes.INTEGER,
      references: 'Groups',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    })
    .then(function() {
      queryInterface.addColumn('Transactions', 'UserId', {
        type: DataTypes.INTEGER,
        references: 'Users',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    })
    .then(function() {
      queryInterface.addColumn('Transactions', 'CardId', {
        type: DataTypes.INTEGER,
        references: 'Cards',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Transactions', 'GroupId')
    .then(function() {
      return queryInterface.removeColumn('Transactions', 'UserId');
    })
    .then(function() {
      return queryInterface.removeColumn('Transactions', 'CardId');
    });
  }
};
