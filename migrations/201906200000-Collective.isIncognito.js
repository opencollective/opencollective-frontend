'use strict';

module.exports = {
  up: (queryInterface, sequelize) => {
    return queryInterface
      .addColumn('Collectives', 'isIncognito', {
        type: sequelize.BOOLEAN,
        defaultValue: false,
      })
      .then(() =>
        queryInterface.addColumn('CollectiveHistories', 'isIncognito', {
          type: sequelize.BOOLEAN,
          defaultValue: false,
        }),
      );
  },

  down: (queryInterface, sequelize) => {
    return queryInterface
      .removeColumn('Collectives', 'isIncognito')
      .then(() => queryInterface.removeColumn('CollectiveHistories', 'isIncognito'));
  },
};
