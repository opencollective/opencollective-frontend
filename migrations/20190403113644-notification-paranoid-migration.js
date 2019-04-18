'use strict';

module.exports = {
  up: async function(queryInterface, DataTypes) {
    await queryInterface.addIndex('Notifications', ['channel', 'type', 'webhookUrl', 'CollectiveId'], {
      indicesType: 'UNIQUE',
    });
    await queryInterface.addColumn('Notifications', 'deletedAt', {
      type: DataTypes.DATE,
    });
  },

  down: async function(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Notifications', ['channel', 'type', 'webhookUrl', 'CollectiveId']);
    await queryInterface.removeColumn('Notifications', 'deletedAt');
  },
};
