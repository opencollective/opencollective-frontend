'use strict';

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('Tiers', 'customFields').then(() =>
      queryInterface.addColumn('Tiers', 'customFields', {
        type: Sequelize.JSON,
      }),
    ),
  down: (queryInterface, Sequelize) =>
    queryInterface.removeColumn('Tiers', 'customFields').then(() =>
      queryInterface.addColumn('Tiers', 'customFields', {
        type: Sequelize.ARRAY(Sequelize.JSON),
      }),
    ),
};
