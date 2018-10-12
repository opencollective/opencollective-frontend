'use strict';

const githubHandleColumn = 'githubHandle';
const maxHandleLength = 39;

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface
      .addColumn('Collectives', githubHandleColumn, {
        type: DataTypes.STRING(maxHandleLength),
      })
      .then(() => {
        queryInterface.addColumn('CollectiveHistories', githubHandleColumn, {
          type: DataTypes.STRING(maxHandleLength),
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
      .removeColumn('Collectives', githubHandleColumn)
      .then(() =>
        queryInterface.removeColumn('CollectiveHistories', githubHandleColumn),
      );
  },
};
