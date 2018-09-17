'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.changeColumn('Groups', 'expensePolicy', {
      type: DataTypes.TEXT('long'),
    });
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface.changeColumn('Groups', 'expensePolicy', {
      type: DataTypes.STRING,
    });
  },
};
