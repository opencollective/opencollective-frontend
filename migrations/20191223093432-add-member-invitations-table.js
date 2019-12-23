'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('MemberInvitations', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      description: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
      deletedAt: { type: DataTypes.DATE },
      since: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('ADMIN', 'MEMBER', 'CONTRIBUTOR', 'HOST', 'BACKER', 'ATTENDEE', 'FOLLOWER'),
        allowNull: false,
      },
      CollectiveId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      TierId: {
        type: DataTypes.INTEGER,
        references: { model: 'Tiers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },
      MemberCollectiveId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Users' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.dropTable('MemberInvitations');
  },
};
