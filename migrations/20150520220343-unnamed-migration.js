'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Cards', 'service', {
      type: DataTypes.STRING,
      defaultValue: 'stripe'
    }).then(function() {
      return queryInterface.addColumn('Cards', 'UserId', {
        type: DataTypes.INTEGER,
        references: 'Users',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }).then(function() {
      return queryInterface.addColumn('Cards', 'GroupId', {
        type: DataTypes.INTEGER,
        references: 'Groups',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }).then(function() {
      return queryInterface.addColumn('Cards', 'serviceId', {
        type: DataTypes.STRING
      });
    }).then(function() {
      return queryInterface.addColumn('Transactions', 'CardId', {
        type: DataTypes.INTEGER,
        references: 'Cards',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }).then(function() {
      return queryInterface.dropTable('UserCard');
    });
  },

  down: function (queryInterface, DataTypes) {
    return queryInterface.removeColumn('Cards', 'service')
      .then(function() {
        return queryInterface.removeColumn('Cards', 'UserId')
      })
      .then(function () {
        return queryInterface.removeColumn('Cards', 'GroupId')
      });
  }
};
