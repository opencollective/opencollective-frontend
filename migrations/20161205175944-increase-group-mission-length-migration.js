'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Groups', 'mission', { type: DataTypes.STRING(128) })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Groups', 'mission', { type: DataTypes.STRING(100) })
  },
};
