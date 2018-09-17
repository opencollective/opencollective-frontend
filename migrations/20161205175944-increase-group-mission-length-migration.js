'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.changeColumn('Groups', 'mission', {
      type: DataTypes.STRING(128),
    });
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface.changeColumn('Groups', 'mission', {
      type: DataTypes.STRING(100),
    });
  },
};
