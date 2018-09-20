'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('Users', 'name', {
        type: DataTypes.STRING,
      })
      .then(function() {
        return queryInterface.addColumn('Users', 'website', {
          type: DataTypes.STRING,
        });
      })
      .then(function() {
        return queryInterface.addColumn('Users', 'twitterHandle', {
          type: DataTypes.STRING,
        });
      })
      .then(function() {
        return queryInterface.removeColumn('Users', 'first_name', {
          type: DataTypes.STRING,
        });
      })
      .then(function() {
        return queryInterface.removeColumn('Users', 'last_name', {
          type: DataTypes.STRING,
        });
      });
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface
      .removeColumn('Users', 'name', {
        type: DataTypes.STRING,
      })
      .then(function() {
        return queryInterface.removeColumn('Users', 'website', {
          type: DataTypes.STRING,
        });
      })
      .then(function() {
        return queryInterface.removeColumn('Users', 'twitterHandle', {
          type: DataTypes.STRING,
        });
      })
      .then(function() {
        return queryInterface.addColumn('Users', 'first_name', {
          type: DataTypes.STRING,
        });
      })
      .then(function() {
        return queryInterface.addColumn('Users', 'last_name', {
          type: DataTypes.STRING,
        });
      });
  },
};
