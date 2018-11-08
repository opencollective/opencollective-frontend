'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Transactions',
      'UsingVirtualCardFromCollectiveId',
      {
        type: Sequelize.INTEGER,
        references: { model: 'Collectives', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
        description:
          'References the collective that created the virtual card used for this order',
      },
    );
  },

  down: queryInterface => {
    return queryInterface.removeColumn(
      'Transactions',
      'UsingVirtualCardFromCollectiveId',
    );
  },
};
