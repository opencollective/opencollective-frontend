'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.changeColumn('Tiers', 'description', {
      type: DataTypes.STRING(510),
    });
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface.changeColumn('Tiers', 'description', {
      type: DataTypes.STRING(255),
    });
  },
};
