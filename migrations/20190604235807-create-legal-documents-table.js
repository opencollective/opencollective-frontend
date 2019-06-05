'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('LegalDocuments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      document_type: Sequelize.ENUM('US_TAX_FORM'),
      request_status: Sequelize.ENUM('NOT_REQUESTED', 'REQUESTED', 'RECEIVED', 'ERROR'),
      year: Sequelize.STRING,
      document_link: Sequelize.STRING,
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
        onDelete: 'SET NULL', //TODO check if this is correct (and test).
        onUpdate: 'CASCADE', //TODO check if this is correct (and test).
      },
      HostCollectiveId: {
        type: Sequelize.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'SET NULL', //TODO check if this is correct (and test).
        onUpdate: 'CASCADE', //TODO check if this is correct (and test).
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('LegalDocuments');
  },
};
