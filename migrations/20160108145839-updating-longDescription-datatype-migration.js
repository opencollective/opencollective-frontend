'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.changeColumn('Groups', 'longDescription', {
      type: DataTypes.TEXT('long'),
    });
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface.changeColumn('Groups', 'longDescription', {
      type: DataTypes.STRING,
    });
  },
};
