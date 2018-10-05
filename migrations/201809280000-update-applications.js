'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('Applications', 'CollectiveId', {
        type: Sequelize.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        after: 'id',
      })
      .then(() =>
        queryInterface.addColumn('Applications', 'type', {
          type: Sequelize.ENUM('apiKey', 'oAuth'),
          after: 'CreatedByUserId',
        }),
      )
      .then(() => {
        console.log('>>> done');
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
      .removeColumn('Applications', 'CollectiveId')
      .then(() => queryInterface.removeColumn('Applications', 'type'))
      .then(() => {
        console.log('>>> done');
      });
  },
};
