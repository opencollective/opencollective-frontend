'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'firstName', { type: Sequelize.STRING(128) })
      .then(() => queryInterface.renameColumn('Users','name','lastName'));
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Users', 'firstName')
      .then(() => queryInterface.renameColumn('Users','lastName','name'));
  }
};