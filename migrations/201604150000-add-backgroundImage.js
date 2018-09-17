'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Groups', 'backgroundImage', {
      type: DataTypes.STRING,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Groups', 'backgroundImage');
  },
};
