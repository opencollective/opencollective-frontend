'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Transactions', 'data', {
      type: DataTypes.JSON,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Transactions', 'data');
  },
};
