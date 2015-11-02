'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Cards', 'UserId', {
      type: DataTypes.INTEGER,
      references: 'Users',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    })
    .then(function() {
      queryInterface.addColumn('Cards', 'GroupId', {
        type: DataTypes.INTEGER,
        references: 'Groups',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Cards', 'UserId')
    .then(function() {
      return queryInterface.removeColumn('Cards', 'GroupId');
    });
  }
};
