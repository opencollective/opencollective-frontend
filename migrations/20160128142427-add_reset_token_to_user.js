'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Users', 'resetPasswordTokenHash', {
      type: DataTypes.STRING
    })
    .then(function() {
      return queryInterface.addColumn('Users', 'resetPasswordSentAt', {
        type: DataTypes.DATE
      });
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'resetPasswordTokenHash')
    .then(function() {
      return queryInterface.removeColumn('Users', 'resetPasswordSentAt');
    })
  }
};
