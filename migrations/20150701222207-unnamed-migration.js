'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.changeColumn('Paykeys', 'paykey', {
      type: DataTypes.STRING,
      unique: true
    });
  },

  down: function (queryInterface) {
    return queryInterface.changeColumn('Paykeys', 'paykey', {
      type: DataTypes.STRING
    });
  }
};
