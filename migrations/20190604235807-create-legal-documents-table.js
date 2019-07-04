'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('LegalDocuments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      requestStatus: Sequelize.ENUM('NOT_REQUESTED', 'REQUESTED', 'RECEIVED', 'ERROR'),
      documentType: Sequelize.ENUM('US_TAX_FORM'),
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      documentLink: Sequelize.STRING,
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
      CollectiveId: {
        type: Sequelize.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('LegalDocuments');
  },
};
