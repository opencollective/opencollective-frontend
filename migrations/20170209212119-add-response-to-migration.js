'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Donations', 'ResponseId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Responses',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Donations', 'ResponseId');
  },
};
