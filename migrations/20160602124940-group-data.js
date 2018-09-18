'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Groups', 'data', DataTypes.JSON);
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Groups', 'data');
  },
};
