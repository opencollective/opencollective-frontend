'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('RequiredLegalDocuments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      documentType: Sequelize.ENUM('US_TAX_FORM'),
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
      HostCollectiveId: {
        type: Sequelize.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('RequiredLegalDocuments');
  },
};
