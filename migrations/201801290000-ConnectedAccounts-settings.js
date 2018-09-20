'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('ConnectedAccounts', 'settings', {
      type: DataTypes.JSON,
    });
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface.removeColumn('ConnectedAccounts', 'settings', {
      type: DataTypes.JSON,
    });
  },
};
