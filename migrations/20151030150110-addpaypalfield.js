'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Users', 'paypalEmail', {
      type: DataTypes.STRING,
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('Users', 'paypalEmail');
  },
};
