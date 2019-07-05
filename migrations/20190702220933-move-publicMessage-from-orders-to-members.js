'use strict';

/**
 * Move `publicMessage` from `Orders` to `Members`.
 * See https://github.com/opencollective/opencollective/issues/2138
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add column to `Members`
    await queryInterface.addColumn('Members', 'publicMessage', Sequelize.STRING);

    // Add public messages from orders to members
    await queryInterface.sequelize.query(
      `
        UPDATE 	"Members" m
        SET		  "publicMessage" = o."publicMessage"
        FROM 	  "Orders" o
        WHERE	  o."CollectiveId" = m."CollectiveId" AND o."FromCollectiveId" = m."MemberCollectiveId"
        AND     o."publicMessage" IS NOT NULL
        AND     LENGTH(o."publicMessage") > 0
      `,
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Members', 'publicMessage');
  },
};
