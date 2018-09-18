'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Transactions', 'deletedAt', {
      type: DataTypes.DATE,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Transactions', 'deletedAt');
  },
};
