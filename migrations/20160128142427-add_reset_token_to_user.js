'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Groups', 'resetPasswordTokenHash', {
      type: DataTypes.STRING
    })
    .then(function() {
      return queryInterface.addColumn('Groups', 'resetPasswordSentAt', {
        type: DataTypes.DATE
      });
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Groups', 'resetPasswordTokenHash')
    .then(function() {
      return queryInterface.removeColumn('Groups', 'resetPasswordSentAt');
    })
  }
};
