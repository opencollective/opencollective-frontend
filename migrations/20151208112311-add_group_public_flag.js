'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Groups', 'isPublic', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Groups', 'isPublic');
  },
};
