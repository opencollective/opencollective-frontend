'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .removeColumn('UserGroups', 'StripeAccountId')
      .then(function() {
        return queryInterface.addColumn('Users', 'StripeAccountId', {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'StripeAccounts' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      });
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface
      .removeColumn('Users', 'StripeAccountId')
      .then(function() {
        return queryInterface.addColumn('UserGroups', 'StripeAccountId', {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'StripeAccounts' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      });
  },
};
