'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('User', 'paypalEmail', {
      type: DataTypes.STRING
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('User', 'paypalEmail');
  }
};
