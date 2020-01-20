'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.describeTable('Collectives').then(async tableDefinition => {
      if (!tableDefinition.isHostAccount) {
        await queryInterface.addColumn('Collectives', 'isHostAccount', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        });
      }
      if (!tableDefinition.plan) {
        await queryInterface.addColumn('Collectives', 'plan', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
    });

    await queryInterface.describeTable('CollectiveHistories').then(async tableDefinition => {
      if (!tableDefinition.isHostAccount) {
        await queryInterface.addColumn('CollectiveHistories', 'isHostAccount', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        });
      }
      if (!tableDefinition.plan) {
        await queryInterface.addColumn('CollectiveHistories', 'plan', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
    });

    await queryInterface.sequelize.query(`
      START TRANSACTION;

      CREATE TEMP TABLE "Hosts" AS
        SELECT c1."id", c1."slug", c1."type",
          COUNT(DISTINCT c2."id") as "totalHostedCollectives",
          (
            SELECT SUM("Transactions"."amount") / 100 FROM "Transactions"
            WHERE "Transactions"."type" = 'CREDIT'
            AND "HostCollectiveId" = "c1"."id"
            AND "platformFeeInHostCurrency" = 0
          ) as "totalAddedFunds",
          (c1."settings"::jsonb ? 'paymentMethods')::boolean as "manualPayments"
          FROM "Collectives" as c1, "Collectives" as c2, "Members"
          WHERE "Members"."role" = 'HOST'
          AND "Members"."CollectiveId" = c2.id
          AND "Members"."MemberCollectiveId" = c1.id
          AND "Members"."deletedAt" IS NULL
          AND c2."deletedAt" IS NULL
          AND c2."deactivatedAt" IS NULL
          AND c2."isActive" = TRUE
          AND c2."type" = 'COLLECTIVE'
          GROUP BY c1."id", c1."slug", c1."type";

      UPDATE "Collectives"
        SET "isHostAccount" = TRUE
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id";

      UPDATE "Collectives"
        SET "plan" = 'legacy-custom-host-plan'
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id"
        AND ("manualPayments" IS TRUE OR "totalAddedFunds" > 1000)
        AND "totalHostedCollectives" > 25;
      UPDATE "Collectives"
        SET "plan" = 'legacy-large-host-plan'
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id"
        AND ("manualPayments" IS TRUE OR "totalAddedFunds" > 1000)
        AND "totalHostedCollectives" > 10 AND "totalHostedCollectives" <= 25;
      UPDATE "Collectives"
        SET "plan" = 'legacy-medium-host-plan'
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id"
        AND ("manualPayments" IS TRUE OR "totalAddedFunds" > 1000)
        AND "totalHostedCollectives" > 5 AND "totalHostedCollectives" <= 10;
      UPDATE "Collectives"
        SET "plan" = 'legacy-small-host-plan'
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id"
        AND ("manualPayments" IS TRUE OR "totalAddedFunds" > 1000)
        AND "totalHostedCollectives" > 1 AND "totalHostedCollectives" <= 5;
      UPDATE "Collectives"
        SET "plan" = 'legacy-single-host-plan'
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id"
        AND ("manualPayments" IS TRUE OR "totalAddedFunds" > 1000)
        AND "totalHostedCollectives" = 1;

      UPDATE "Collectives"
        SET "data" = '{}'::jsonb
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id"
        AND "data" is NULL;
      UPDATE "Collectives"
        SET "data" = jsonb_set("data"::jsonb, '{plan}', '{}'::jsonb)
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id";
      UPDATE "Collectives"
        SET "data" = jsonb_set("data"::jsonb, '{plan, manualPayments}', 'true'::jsonb)
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id"
        AND ("manualPayments" IS TRUE );
      UPDATE "Collectives"
        SET "data" = jsonb_set("data"::jsonb, '{plan, addedFundsLimit}', 'null'::jsonb)
        FROM "Hosts"
        WHERE "Collectives"."id" = "Hosts"."id"
        AND ("totalAddedFunds" > 1000);

      COMMIT;
    `);

    await queryInterface.sequelize.query(`
      UPDATE "Collectives"
      SET "plan" = 'owned'
      WHERE "slug" IN ('europe', 'opencollective-host', 'foundation', 'opencollectiveinc');
    `);

    if (['development', 'e2e', 'ci', 'circleci'].includes(process.env.NODE_ENV) || process.env.E2E_TEST) {
      await queryInterface.sequelize.query(`
        UPDATE "Collectives"
        SET "plan" = 'owned'
        WHERE "slug" IN ('opensourceorg');
     `);
    } else if (['production', 'staging'].includes(process.env.NODE_ENV)) {
      await queryInterface.sequelize.query(`
        UPDATE "Collectives"
        SET "plan" = 'owned'
        WHERE "slug" IN ('opensource');
     `);
    }
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Collectives', 'isHostAccount');
    await queryInterface.removeColumn('CollectiveHistories', 'isHostAccount');
    await queryInterface.removeColumn('Collectives', 'plan');
    await queryInterface.removeColumn('CollectiveHistories', 'plan');
  },
};
