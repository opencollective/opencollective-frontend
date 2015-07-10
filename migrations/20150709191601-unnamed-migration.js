'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Cards', 'data', {
      type: DataTypes.JSON
    }).then(function() {
      return queryInterface.addColumn('Cards', 'confirmedAt', {
        type: DataTypes.DATE
      });
    }).then(function() {
      return queryInterface.addColumn('Cards', 'deletedAt', {
        type: DataTypes.DATE
      });
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Cards', 'data')
      .then(function() {
        return queryInterface.removeColumn('Cards', 'confirmedAt');
      })
      .then(function() {
        return queryInterface.removeColumn('Cards', 'deletedAt');
      });
  }
};
