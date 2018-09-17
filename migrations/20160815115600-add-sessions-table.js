'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable(
      'Sessions',
      {
        sid: {
          type: Sequelize.STRING(32),
          primaryKey: true,
        },

        expires: {
          type: Sequelize.DATE,
        },

        data: {
          type: Sequelize.TEXT,
        },

        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },

        updatedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
      },
      {
        paranoid: true,
      },
    );
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('Sessions');
  },
};
