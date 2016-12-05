'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Groups', 'mission', { type: DataTypes.STRING(125) })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Groups', 'mission', { type: DataTypes.STRING(100) })
  },
};
