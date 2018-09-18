'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Transactions', 'interval', {
      type: DataTypes.STRING,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Transactions', 'interval');
  },
};
