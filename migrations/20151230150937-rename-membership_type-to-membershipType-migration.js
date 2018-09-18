'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.renameColumn(
      'Groups',
      'membership_type',
      'membershipType',
    );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.renameColumn(
      'Groups',
      'membershipType',
      'membership_type',
    );
  },
};
