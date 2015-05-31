'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Transactions', 'approved', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }).then(function() {
      return queryInterface.addColumn('Transactions', 'approvedAt', {
        type: DataTypes.DATE
      });
    }).then(function() {
      return queryInterface.addColumn('Transactions', 'reimbursedAt', {
        type: DataTypes.DATE
      });
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Transactions', 'approved')
      .then(function() {
        return queryInterface.removeColumn('Transactions', 'approvedAt');
      })
      .then(function() {
        return queryInterface.removeColumn('Transactions', 'reimbursedAt');
      });
  }
};
