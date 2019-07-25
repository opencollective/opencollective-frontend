/**
 * This file aims to group all the logic related to the concept of "Contributor".
 *
 * A contributor is a person or an entity that contributes financially or by any other
 * mean to the mission of the collective. While "Member" is dedicated to permissions
 * and can have multiple entries for the same collective (one for BACKER role, one  for ADMIN...etc)
 * contributors should surface only unique collectives.
 */

import { sequelize } from '../models';

/**
 * Returns all the contributors for given collective
 */
export const getContributorsForCollective = (collectiveId, { limit = 5000 } = {}) => {
  return sequelize.query(
    `
      SELECT
        mc.id,
        mc.name,
        mc.slug as "collectiveSlug",
        mc.image,
        mc.type,
        mc."isIncognito",
        MIN(m.since) as since,
        MAX(m."publicMessage") as "publicMessage",
        ARRAY_AGG(DISTINCT m."role") as roles,
        COALESCE(MAX(m.description), MAX(tier.name)) as description,
        (
          SELECT  COALESCE(SUM(amount), 0) 
          FROM    "Transactions" 
          WHERE   "CollectiveId" = :collectiveId 
          AND     TYPE = 'CREDIT'
          AND     "deletedAt" IS NULL
          AND     "RefundTransactionId" IS NULL
          AND     ("FromCollectiveId" = mc.id OR "UsingVirtualCardFromCollectiveId" = mc.id)
        ) AS "totalAmountDonated"
      FROM
        "Collectives" mc
      INNER JOIN
        "Members" m ON m."MemberCollectiveId" = mc.id AND m."deletedAt" IS NULL
      LEFT JOIN 
        "Tiers" tier ON m."TierId" = tier.id
      WHERE
        m."CollectiveId" = :collectiveId
      GROUP BY	  
        mc.id
      ORDER BY
        "totalAmountDonated" DESC,
        "since" ASC
      LIMIT :limit
    `,
    {
      replacements: { collectiveId, limit },
      type: sequelize.QueryTypes.SELECT,
    },
  );
};

/**
 * Returns all the contributors for given tier
 */
export const getContributorsForTier = (tierId, { limit = 5000 } = {}) => {
  return sequelize.query(
    `
      SELECT
        mc.id,
        mc.name,
        mc.slug as "collectiveSlug",
        mc.image,
        mc.type,
        mc."isIncognito",
        MIN(m.since) as since,
        MAX(m."publicMessage") as "publicMessage",
        ARRAY_AGG(DISTINCT m."role") as roles,
        COALESCE(MAX(m.description), MAX(tier.name)) as description,
        (
          SELECT  COALESCE(SUM(amount), 0) 
          FROM    "Transactions" 
          WHERE   "CollectiveId" = tier."CollectiveId" 
          AND     TYPE = 'CREDIT' 
          AND     "deletedAt" IS NULL 
          AND     "RefundTransactionId" IS NULL
          AND     ("FromCollectiveId" = mc.id OR "UsingVirtualCardFromCollectiveId" = mc.id)
        ) AS "totalAmountDonated"
      FROM
        "Collectives" mc
      INNER JOIN
        "Members" m ON m."MemberCollectiveId" = mc.id AND m."deletedAt" IS NULL
      INNER JOIN
        "Tiers" tier ON m."TierId" = tier.id
      WHERE
        m."TierId" = ?
      GROUP BY	  
        tier.id, mc.id
      ORDER BY
        "totalAmountDonated" DESC,
        "since" ASC
      LIMIT ?
    `,
    {
      replacements: [tierId, limit],
      type: sequelize.QueryTypes.SELECT,
    },
  );
};
