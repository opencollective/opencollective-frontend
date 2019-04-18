'use strict';

module.exports = {
  up: async function(queryInterface, DataTypes) {
    await queryInterface.addIndex('Notifications', ['channel', 'type', 'webhookUrl', 'CollectiveId'], {
      indicesType: 'UNIQUE',
    });
  },

  down: async function(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Notifications', ['channel', 'type', 'webhookUrl', 'CollectiveId']);
  },
};
