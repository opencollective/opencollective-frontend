'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Users', 'lastLoginAt', {
      type: DataTypes.DATE,
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Users', 'lastLoginAt');
  },
};
