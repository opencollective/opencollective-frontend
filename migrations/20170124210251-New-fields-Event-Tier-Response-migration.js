'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Events', 'address', {
        type: Sequelize.STRING(255),
      })
      .then(() =>
        queryInterface.addColumn('Events', 'backgroundImage', {
          type: Sequelize.STRING(255),
        }),
      )
      .then(() =>
        queryInterface.renameColumn('Events', 'quantity', 'maxQuantity'),
      )
      .then(() =>
        queryInterface.renameColumn('Tiers', 'quantity', 'maxQuantity'),
      )
      .then(() =>
        queryInterface.addColumn('Responses', 'description', {
          type: Sequelize.STRING(255),
        }),
      );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('Events', 'address')
      .then(() => queryInterface.removeColumn('Events', 'backgroundImage'))
      .then(() =>
        queryInterface.renameColumn('Events', 'maxQuantity', 'quantity'),
      )
      .then(() =>
        queryInterface.renameColumn('Tiers', 'maxQuantity', 'quantity'),
      )
      .then(() => queryInterface.removeColumn('Responses', 'description'));
  },
};
