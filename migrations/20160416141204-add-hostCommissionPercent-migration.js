'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'Groups',
      'hostFeePercent',
      Sequelize.FLOAT,
    );
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Groups', 'hostFeePercent');
  },
};
