'use strict';

/**
 * This migration will invalidate all paypal adaptives that are not used anymore.
 */
module.exports = {
  up: queryInterface => {
    return queryInterface.sequelize.query(`
      UPDATE "PaymentMethods"
      SET "deletedAt" = NOW()
      WHERE id IN (
        SELECT id FROM "PaymentMethods" pm 
        WHERE service = 'paypal'
        AND ("type" IS NULL OR "type" = 'adaptive')
        AND pm."deletedAt" IS NULL
        AND id NOT IN (
          SELECT max(id) AS id FROM "PaymentMethods" pm 
          WHERE service = 'paypal'
          AND ("type" IS NULL OR "type" = 'adaptive')
          AND pm."deletedAt" IS NULL
          GROUP BY "CollectiveId"
        )
      )
    `);
  },

  down: () => {
    /* No downgrade possible */
  },
};
