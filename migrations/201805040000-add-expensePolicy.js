'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Collectives', 'expensePolicy', {
        type: Sequelize.TEXT,
      })
      .then(() =>
        queryInterface.addColumn('CollectiveHistories', 'expensePolicy', {
          type: Sequelize.TEXT,
        }),
      )
      .then(() => {
        console.log('>>> done');
      });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('Collectives', 'expensePolicy')
      .then(() =>
        queryInterface.removeColumn('CollectiveHistories', 'expensePolicy'),
      );
  },
};
