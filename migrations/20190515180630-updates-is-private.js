'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Updates', 'isPrivate', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Updates', 'isPrivate');
  },
};
