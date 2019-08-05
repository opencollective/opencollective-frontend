'use strict';
import { map } from 'bluebird';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const results = await queryInterface.sequelize.query(`
        SELECT * FROM "Collectives"
        WHERE "Collectives"."isActive" IS TRUE
        AND "Collectives"."approvedAt" IS NULL
    `);
    const collectives = results[0];

    return map(
      collectives,
      async collective => {
        const [membership] = await queryInterface.sequelize.query(
          `
          SELECT "since" FROM "Members" m
          WHERE m."CollectiveId" = :collectiveId
          AND m."MemberCollectiveId" = :MemberCollectiveId
          AND m."role" = 'HOST'
      `,
          {
            replacements: {
              collectiveId: collective.id,
              MemberCollectiveId: collective.HostCollectiveId,
            },
            type: queryInterface.sequelize.QueryTypes.SELECT,
          },
        );

        if (membership) {
          return queryInterface.sequelize.query(
            `
          UPDATE "Collectives"
            SET "approvedAt" = :approvedAt
          WHERE "id" = :collectiveId
        `,
            {
              replacements: {
                approvedAt: membership.since,
                collectiveId: collective.id,
              },
            },
          );
        }
        return;
      },
      { concurrency: 4 },
    );
  },

  down: async (queryInterface, Sequelize) => {
    return;
  },
};
