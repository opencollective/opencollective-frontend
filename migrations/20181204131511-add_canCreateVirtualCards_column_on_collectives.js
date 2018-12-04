'use strict';

const canCreateVirtualCardsColName = 'canCreateVirtualCards';

/**
 * Add a new `canCreateVirtualCards` on collectives to specify if collective is
 * allowed to create new VirtualCards.
 */
module.exports = {
  up: async (queryInterface, DataTypes) => {
    const canCreateVirtualCardsColProps = {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'isSuperCollective',
    };

    await queryInterface.addColumn('Collectives', canCreateVirtualCardsColName, canCreateVirtualCardsColProps);
    await queryInterface.addColumn('CollectiveHistories', canCreateVirtualCardsColName, canCreateVirtualCardsColProps);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Collectives', canCreateVirtualCardsColName);
    await queryInterface.removeColumn('CollectiveHistories', canCreateVirtualCardsColName);
  },
};
