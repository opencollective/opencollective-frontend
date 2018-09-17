'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('Activities', 'GroupId', {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Groups' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
      .then(function() {
        queryInterface.addColumn('Activities', 'UserId', {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'Users' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      })
      .then(function() {
        queryInterface.addColumn('Activities', 'TransactionId', {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'Transactions' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      });
  },

  down: function(queryInterface) {
    return queryInterface
      .removeColumn('Activities', 'GroupId')
      .then(function() {
        return queryInterface.removeColumn('Activities', 'UserId');
      })
      .then(function() {
        return queryInterface.removeColumn('Activities', 'TransactionId');
      });
  },
};
