'use strict';

/**
 * `migrations/20171214165000-add-payment-type.js` properly set the type to 'adaptive'
 * for PayPal adaptive payment methods, but the change was not reflected in the code,
 * thus all PayPal pre-approvals generated after 2017-12-14 have not type set.
 */
module.exports = {
  up: queryInterface => {
    return queryInterface.sequelize.query(`
      UPDATE "PaymentMethods"
      SET type = 'adaptive'
      WHERE type is NULL and service = 'paypal'
    `);
  },

  down: () => {
    /* No downgrade possible */
  },
};
