'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        // Create the new column
        queryInterface.addColumn(
          'Members',
          'since',
          {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
          { transaction: t },
        ),
        // Set to the new field the createdAt value
        queryInterface.sequelize.query(
          `
          UPDATE "Members"
          SET "since" = COALESCE("createdAt", NOW())`,
          { transaction: t },
        ),
        // Change the new column to do not accept null values
        queryInterface.changeColumn(
          'Members',
          'since',
          {
            type: Sequelize.DATE,
            allowNull: false,
          },
          { transaction: t },
        ),
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Members', 'since');
  },
};
