'use strict';

module.exports = {
  up: (queryInterface, sequelize) => {
    return queryInterface.addColumn('Collectives', 'isAnonymous', {
      type: sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: (queryInterface, sequelize) => {
    return queryInterface.removeColumn('Collectives', 'isAnonymous');
  },
};
