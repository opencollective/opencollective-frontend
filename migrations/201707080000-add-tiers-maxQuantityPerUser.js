'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('Tiers', 'maxQuantityPerUser', { type: DataTypes.INTEGER })
      .then(() =>
        queryInterface.addColumn('Tiers', 'goal', { type: DataTypes.INTEGER }),
      )
      .then(() =>
        queryInterface.addColumn('Tiers', 'type', {
          type: DataTypes.STRING,
          defaultValue: 'TICKET',
        }),
      );
  },

  down: function(queryInterface) {
    return queryInterface
      .removeColumn('Tiers', 'maxQuantityPerUser')
      .then(() => queryInterface.removeColumn('Tiers', 'goal'))
      .then(() => queryInterface.removeColumn('Tiers', 'type'));
  },
};
