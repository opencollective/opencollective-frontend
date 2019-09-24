'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('TierHistories', 'description', {
      type: Sequelize.STRING(510),
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('TierHistories', 'description', {
      type: Sequelize.STRING(255),
    });
  },
};
