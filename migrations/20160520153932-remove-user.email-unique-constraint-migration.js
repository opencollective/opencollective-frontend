'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true, // Need to completely describe the field: http://docs.sequelizejs.com/en/latest/docs/migrations/
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },
};
