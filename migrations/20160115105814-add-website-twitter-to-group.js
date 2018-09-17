'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('Groups', 'website', {
        type: DataTypes.STRING,
      })
      .then(function() {
        return queryInterface.addColumn('Groups', 'twitterHandle', {
          type: DataTypes.STRING,
        });
      });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Groups', 'website').then(function() {
      return queryInterface.removeColumn('Groups', 'twitterHandle');
    });
  },
};
