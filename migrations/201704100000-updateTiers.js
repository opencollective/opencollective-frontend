'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .changeColumn('Tiers', 'EventId', {
        type: Sequelize.INTEGER,
        references: {
          model: 'Events',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      })
      .then(() =>
        queryInterface.addColumn('Tiers', 'slug', {
          type: Sequelize.STRING,
        }),
      );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .changeColumn('Tiers', 'EventId', {
        type: Sequelize.INTEGER,
        references: {
          model: 'Events',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      })
      .then(() => queryInterface.removeColumn('Tiers', 'slug'));
  },
};
