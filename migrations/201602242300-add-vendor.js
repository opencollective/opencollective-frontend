'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    // http://stackoverflow.com/a/30021018
    queryInterface.removeColumn('Transactions', 'beneficiary');
    return queryInterface.addColumn('Transactions', 'vendor', {
      type: DataTypes.STRING,
    });
  },

  down: function(queryInterface, Sequelize) {
    queryInterface.addColumn('Transactions', 'beneficiary', {
      type: DataTypes.STRING,
    });
    return queryInterface.removeColumn('Transactions', 'beneficiary');
  },
};
