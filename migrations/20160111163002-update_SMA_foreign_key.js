'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface
      .removeColumn('Groups', 'StripeManagedAccountId')
      .then(function() {
        return queryInterface.addColumn('Groups', 'StripeAccountId', {
          type: DataTypes.INTEGER,
          references: 'StripeAccounts',
          referencesKey: 'id',
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        })
      });
  },

  down: function (queryInterface, DataTypes) {
    return queryInterface
      .addColumn('Groups', 'StripeManagedAccountId', {
        type: DataTypes.INTEGER,
        references: 'StripeManagedAccounts',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
      .then(function() {
        return queryInterface
          .removeColumn('Groups', 'StripeAccountId');
      });
  }
};
