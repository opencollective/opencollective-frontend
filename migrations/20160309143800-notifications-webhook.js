'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.addColumn('Notifications', 'webhookUrl', {
      type: DataTypes.STRING,
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Notifications', 'webhookUrl');
  },
};
