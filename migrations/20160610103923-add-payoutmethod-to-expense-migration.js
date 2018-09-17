'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Expenses', 'payoutMethod', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Expenses', 'payoutMethod');
  },
};
