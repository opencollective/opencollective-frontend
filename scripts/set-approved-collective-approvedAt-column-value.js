#!/usr/bin/env node
import '../server/env';
import { map } from 'bluebird';
import { sequelize } from '../server/models';

/**
 * This script updates the value of Collectives approvedAt
 */

async function run() {
  const collectives = await sequelize.query(
    `
      SELECT * FROM "Collectives"
      WHERE "Collectives"."isActive" IS TRUE
      AND "Collectives"."approvedAt" = '2019-08-06'
  `,
    { type: sequelize.QueryTypes.SELECT },
  );

  return map(
    collectives,
    async collective => {
      const [membership] = await sequelize.query(
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
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (membership) {
        return sequelize.query(
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
    },
    { concurrency: 4 },
  );
}

run()
  .then(() => {
    console.log('>>> Completed!');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit();
  });
