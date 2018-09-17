'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('Groups', 'longDescription', {
        type: DataTypes.STRING,
      })
      .then(function() {
        return queryInterface.addColumn('Groups', 'logo', {
          type: DataTypes.STRING,
        });
      })
      .then(function() {
        return queryInterface.addColumn('Groups', 'video', {
          type: DataTypes.STRING,
        });
      })
      .then(function() {
        return queryInterface.addColumn('Groups', 'image', {
          type: DataTypes.STRING,
        });
      })
      .then(function() {
        return queryInterface.addColumn('Groups', 'expensePolicy', {
          type: DataTypes.STRING,
        });
      });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('Groups', 'longDescription')
      .then(function() {
        return queryInterface.removeColumn('Groups', 'logo');
      })
      .then(function() {
        return queryInterface.removeColumn('Groups', 'video');
      })
      .then(function() {
        return queryInterface.removeColumn('Groups', 'image');
      })
      .then(function() {
        return queryInterface.removeColumn('Groups', 'expensePolicy');
      });
  },
};
