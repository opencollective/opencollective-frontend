'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Lift Added Funds limit whatever the amount of usage before 2020-01-17

    await queryInterface.sequelize.query(`
      START TRANSACTION;

      CREATE TEMP TABLE "HostWithAddedFunds" AS
      SELECT "Collectives"."id", "Collectives"."slug",
      SUM("Orders"."totalAmount") / 100 as "totalAddedFunds"
      FROM "Orders", "PaymentMethods", "Collectives"
      WHERE "Orders"."PaymentMethodId" = "PaymentMethods"."id"
      AND "PaymentMethods"."service" = 'opencollective'
      AND "PaymentMethods"."type" = 'collective'
      AND "Orders"."status" = 'PAID'
      AND "PaymentMethods"."CollectiveId" = "Collectives"."id"
      AND "Collectives"."type" IN ('USER', 'ORGANIZATION')
      AND "Orders"."processedAt" < '2020-01-17'
      GROUP BY "Collectives"."id";

      UPDATE "Collectives"
        SET "data" = '{}'::jsonb
        FROM "HostWithAddedFunds"
        WHERE "Collectives"."id" = "HostWithAddedFunds"."id"
        AND "data" is NULL;
      UPDATE "Collectives"
        SET "data" = jsonb_set("data"::jsonb, '{plan}', '{}'::jsonb)
        FROM "HostWithAddedFunds"
        WHERE "Collectives"."id" = "HostWithAddedFunds"."id"
        AND data->>'plan' IS NULL;
      UPDATE "Collectives"
        SET "data" = jsonb_set("data"::jsonb, '{plan, addedFundsLimit}', 'null'::jsonb)
        FROM "HostWithAddedFunds"
        WHERE "Collectives"."id" = "HostWithAddedFunds"."id";

      COMMIT;
    `);

    // Lift Bank Transfer limit whatever the amount of usage before 2020-01-17

    await queryInterface.sequelize.query(`
      START TRANSACTION;

      CREATE TEMP TABLE "HostsWithBankTransfers" AS
      SELECT "Hosts"."id", "Hosts"."slug",
      SUM("Orders"."totalAmount") / 100 as "totalBankTransfers"
      FROM "Orders", "Collectives", "Transactions", "Collectives" as "Hosts"
      WHERE "Orders"."CollectiveId" = "Collectives"."id"
      AND "Orders"."PaymentMethodId" IS NULL
      AND "Orders"."status" = 'PAID'
      AND "totalAmount" > 0
      AND "processedAt" IS NOT NULL
      AND "processedAt" > '2018-11-01'
      AND "processedAt" < '2020-01-17'
      AND "Transactions"."OrderId" = "Orders"."id"
      AND "Transactions"."type" = 'CREDIT'
      AND "Transactions"."HostCollectiveId" = "Hosts"."id"
      GROUP BY "Hosts"."id";

      UPDATE "Collectives"
        SET "data" = '{}'::jsonb
        FROM "HostsWithBankTransfers"
        WHERE "Collectives"."id" = "HostsWithBankTransfers"."id"
        AND "data" is NULL;
      UPDATE "Collectives"
        SET "data" = jsonb_set("data"::jsonb, '{plan}', '{}'::jsonb)
        FROM "HostsWithBankTransfers"
        WHERE "Collectives"."id" = "HostsWithBankTransfers"."id"
        AND data->>'plan' IS NULL;
      UPDATE "Collectives"
        SET "data" = jsonb_set("data"::jsonb, '{plan, bankTransfersLimit}', 'null'::jsonb)
        FROM "HostsWithBankTransfers"
        WHERE "Collectives"."id" = "HostsWithBankTransfers"."id";

      COMMIT;
    `);
  },

  down: async queryInterface => {},
};
