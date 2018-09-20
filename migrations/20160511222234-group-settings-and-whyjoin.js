'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('Groups', 'settings', DataTypes.JSON)
      .then(() =>
        queryInterface.addColumn('Groups', 'whyJoin', DataTypes.TEXT('long')),
      );
  },

  down: function(queryInterface) {
    return queryInterface
      .removeColumn('Groups', 'settings')
      .then(() => queryInterface.removeColumn('Groups', 'whyJoin'));
  },
};
