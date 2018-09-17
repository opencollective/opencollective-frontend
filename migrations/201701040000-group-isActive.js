'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .renameColumn('Groups', 'isPublic', 'isActive')
      .then(() =>
        queryInterface.renameColumn('GroupHistories', 'isPublic', 'isActive'),
      );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .renameColumn('Groups', 'isActive', 'isPublic')
      .then(() =>
        queryInterface.renameColumn('GroupHistories', 'isActive', 'isPublic'),
      );
  },
};
