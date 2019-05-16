'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addIndex('Notifications', ['channel', 'type', 'webhookUrl', 'CollectiveId'], {
        indicesType: 'UNIQUE',
      })
      .then(() => {
        queryInterface.removeIndex('Notifications', ['type', 'CollectiveId', 'UserId']);
      });
  },

  down: function(queryInterface, Sequelize) {
    queryInterface.removeIndex('Notifications', ['channel', 'type', 'webhookUrl', 'CollectiveId']).then(() => {
      queryInterface.addIndex('Notifications', ['type', 'CollectiveId', 'UserId'], { indicesType: 'UNIQUE' });
    });
  },
};
