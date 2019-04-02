'use strict';

const pendingEmailCol = 'emailWaitingForValidation';
const emailConfirmationTokenCol = 'emailConfirmationToken';
const uniqueEmailConstraint = { type: 'unique', name: 'unique_user_pending_email' };

/**
 * Add two columns for users to be able to change their emails.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add pending email column
    await queryInterface.addColumn('Users', pendingEmailCol, { type: Sequelize.STRING });
    await queryInterface.addConstraint('Users', [pendingEmailCol], uniqueEmailConstraint);

    // Add confirmation token column
    await queryInterface.addColumn('Users', emailConfirmationTokenCol, { type: Sequelize.STRING });
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Users', pendingEmailCol);
    await queryInterface.removeConstraint('Users', uniqueEmailConstraint.name);
    await queryInterface.removeColumn('Users', emailConfirmationTokenCol);
  },
};
