'use strict';
const DRY_RUN = false;
let totalInserts = 0;
import Promise from 'bluebird';

// There are 135 distinct pairs (source, collective) that don't have a row in the Members table:
// see https://github.com/opencollective/opencollective/issues/1186

const insert = (sequelize, table, entry) => {
  delete entry.id;
  totalInserts++;
  if (DRY_RUN) {
    return console.log(`INSERT INTO "${table}":`, entry);
  }
  return sequelize.query(
    `
    INSERT INTO "${table}" ("${Object.keys(entry).join(
      '","',
    )}") VALUES (:${Object.keys(entry).join(',:')})
  `,
    { replacements: entry },
  );
};

module.exports = {
  up: queryInterface => {
    return queryInterface.sequelize
      .query(
        `
      with pairs as (
        SELECT max(o."CreatedByUserId") as "CreatedByUserId", min(t."createdAt") as "createdAt", t."FromCollectiveId", max(fc.slug) as "fromCollective", max(fc.type) as "fromCollective.type", t."CollectiveId", max(c.slug) as "collective", max(c.type) as "collective.type", count(*) as "numberOfTransactions", max(o."TierId") as "TierId"
        FROM "Transactions" t
        LEFT JOIN "Collectives" fc ON fc.id=t."FromCollectiveId"
        LEFT JOIN "Collectives" c ON c.id=t."CollectiveId"
        LEFT JOIN "Orders" o ON t."OrderId" = o.id
        WHERE t."deletedAt" IS NULL
          AND t.type='CREDIT'
          AND o.id IS NOT NULL
          AND t."RefundTransactionId" IS NULL
        GROUP BY t."FromCollectiveId", t."CollectiveId"
      )
      
      SELECT p.*
      FROM pairs p
      LEFT JOIN "Members" m ON m."MemberCollectiveId" = p."FromCollectiveId" AND m."CollectiveId"=p."CollectiveId"
      WHERE m.id IS NULL
        AND m."deletedAt" IS NULL
      `,
        { type: queryInterface.sequelize.QueryTypes.SELECT },
      )
      .map(pair => {
        const memberData = {
          CollectiveId: pair.CollectiveId,
          MemberCollectiveId: pair.FromCollectiveId,
          TierId: pair.TierId,
          role: 'BACKER',
          createdAt: pair.createdAt,
          updatedAt: new Date(),
          CreatedByUserId: pair.CreatedByUserId,
        };

        if (!memberData.CreatedByUserId) {
          console.error(
            '>>> missing CreatedByUserId (falling back to UserId 2 xdamman) for',
            memberData,
          );
          memberData.CreatedByUserId = 2;
        }
        return insert(queryInterface.sequelize, 'Members', memberData);
      })
      .then(() => {
        console.log('>>> total items inserted: ', totalInserts);
        if (DRY_RUN) {
          throw new Error('All done');
        }
      });
  },

  down: (queryInterface, Sequelize) => {},
};
