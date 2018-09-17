'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Donations', 'PaymentMethodId', {
        type: Sequelize.INTEGER,
        references: {
          model: 'PaymentMethods',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
      .then(() =>
        queryInterface.addColumn('Donations', 'isProcessed', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        }),
      );
  },

  down: function(queryInterface) {
    return queryInterface
      .removeColumn('Donations', 'PaymentMethodId')
      .then(() => queryInterface.removeColumn('Donations', 'isProcessed'));
  },
};
