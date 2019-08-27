'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`UPDATE "PaymentMethods"
SET "name" = replace("name", ' Collective', ' Add Funds')
WHERE "PaymentMethods"."service" = 'opencollective'
AND "PaymentMethods"."type" = 'collective'
AND EXISTS (SELECT * FROM "Collectives" as c WHERE c."id" = "PaymentMethods"."CollectiveId" and c."type" = 'ORGANIZATION')`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`UPDATE "PaymentMethods"
SET "name" = replace("name", ' Add Funds', ' Collective')
WHERE "PaymentMethods"."service" = 'opencollective'
AND "PaymentMethods"."type" = 'collective'
AND EXISTS (SELECT * FROM "Collectives" as c WHERE c."id" = "PaymentMethods"."CollectiveId" and c."type" = 'ORGANIZATION')`);
  },
};
