'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Users', 'isOrganization', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      })
      .then(() =>
        queryInterface.addColumn('Users', 'description', {
          type: Sequelize.STRING(140),
        }),
      );
  },

  down: function(queryInterface) {
    return queryInterface
      .removeColumn('Users', 'isOrganization')
      .then(() => queryInterface.removeColumn('Users', 'description'));
  },
};
