'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('ExpenseAttachments', 'url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('ExpenseAttachments', 'url', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
