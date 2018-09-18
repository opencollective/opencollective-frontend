'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface
      .addColumn('Users', 'resetPasswordTokenHash', {
        type: DataTypes.STRING,
      })
      .then(() => {
        return queryInterface.addColumn('Users', 'resetPasswordSentAt', {
          type: DataTypes.DATE,
        });
      });
  },

  down: queryInterface => {
    return queryInterface
      .removeColumn('Users', 'resetPasswordTokenHash')
      .then(() => {
        return queryInterface.removeColumn('Users', 'resetPasswordSentAt');
      });
  },
};
