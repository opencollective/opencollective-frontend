'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    // http://stackoverflow.com/a/30021018
    return queryInterface.sequelize.query(
      'ALTER TABLE "UserGroups" ADD COLUMN id SERIAL PRIMARY KEY',
    );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('UserGroups', 'id');
  },
};
