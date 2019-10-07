'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Users', 'lastLogin', {
      type: DataTypes.DATE,
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Users', 'lastLogin');
  },
};
