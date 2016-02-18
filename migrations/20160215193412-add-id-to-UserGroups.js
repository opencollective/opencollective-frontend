'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    return queryInterface.addColumn('UserGroups', 'id', {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    });
  },

  down: function (queryInterface) {

    return queryInterface.removeColumn('UserGroups', 'id');
  }
};
