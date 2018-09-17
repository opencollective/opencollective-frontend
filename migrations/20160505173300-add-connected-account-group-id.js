'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'ConnectedAccounts',
      'GroupId',
      Sequelize.INTEGER,
    );
  },

  down: function(queryInterface) {
    return queryInterface.removeColumn('ConnectedAccounts', 'GroupId');
  },
};
