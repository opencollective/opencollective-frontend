'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Groups', 'slug', {
      type: DataTypes.STRING,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Groups', 'slug');
  },
};
