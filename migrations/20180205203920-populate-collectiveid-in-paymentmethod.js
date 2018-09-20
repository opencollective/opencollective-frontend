'use strict';

const Promise = require('bluebird');

module.exports = {
  up: (queryInterface, sequelize) => {
    // find all post-migration credit cards that don't have a collective id
    return queryInterface.sequelize
      .query(
        `
      SELECT * FROM "PaymentMethods"

      WHERE "service" ilike 'stripe'
        AND "type" ilike 'creditcard'
        AND "deletedAt" is null
        AND "CollectiveId" is null
        AND "archivedAt" is null
        AND "name" is not null
      `,
        { type: sequelize.QueryTypes.SELECT },
      )
      .then(paymentMethods => {
        console.log('PaymentMethods found: ', paymentMethods.length);

        return Promise.map(paymentMethods, pm => {
          return queryInterface.sequelize
            .query(
              `
          SELECT distinct("FromCollectiveId") FROM "Orders"
          WHERE "deletedAt" is null
            AND "PaymentMethodId" = ${pm.id} 
          `,
              { type: sequelize.QueryTypes.SELECT },
            )
            .then(fromCollectiveIds => {
              if (fromCollectiveIds.length === 0) {
                console.log(
                  'No fromCollectiveId found for pm.id',
                  pm.id,
                  'skipping',
                );
                return Promise.resolve();
              }
              if (fromCollectiveIds.length > 1) {
                throw new Error(
                  'Found more than 1 fromCollectiveId for paymentMethodId',
                  pm.id,
                );
              }

              return queryInterface.sequelize.query(
                `
            UPDATE "PaymentMethods" 
              SET "CollectiveId" = :collectiveId
            WHERE "id" = :pmId
            `,
                {
                  replacements: {
                    collectiveId: fromCollectiveIds[0].FromCollectiveId,
                    pmId: pm.id,
                  },
                },
              );
            });
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve(); // No way to revert this
  },
};
