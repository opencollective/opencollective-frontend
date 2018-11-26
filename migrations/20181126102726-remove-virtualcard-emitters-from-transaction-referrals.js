'use strict';

/**
 * This will ensure we don't count collectives as referral when the transaction
 * is paid with one of its virtual cards.
 */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      UPDATE	"Orders" o
      SET	    "ReferralCollectiveId" = NULL
      FROM	  "PaymentMethods" pm, "PaymentMethods" spm
      WHERE   o."PaymentMethodId" = pm.id
      AND	    pm."SourcePaymentMethodId" = spm.id
      AND     o."ReferralCollectiveId" = spm."CollectiveId";
    `);
  },

  down: (queryInterface, Sequelize) => {
    /**
     * Once removed, the referral information is lost and cannot be restored.
     */
  },
};
