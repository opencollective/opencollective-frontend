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
        MIN(m.since) as since,
        ARRAY_AGG(DISTINCT m."role") as roles,
        COALESCE(SUM(t."netAmountInCollectiveCurrency"), 0) AS "totalAmountDonated",
        COALESCE(MAX(m.description), MAX(tier.name)) as description
      FROM
        "Collectives" mc
      INNER JOIN
        "Members" m ON m."MemberCollectiveId" = mc.id
      LEFT JOIN
        "Transactions" t
          ON t."type" = 'CREDIT'
          AND (t."FromCollectiveId" = mc.id OR t."UsingVirtualCardFromCollectiveId" = mc.id)
      CROSS JOIN LATERAL (
        SELECT name
        FROM "Tiers"
        WHERE id = m."TierId"
        ORDER BY "Tiers".amount DESC
        LIMIT 1
      ) AS tier
      WHERE
        m."CollectiveId" = ?
      GROUP BY	  
        mc.id
      ORDER BY
        "totalAmountDonated" DESC,
        "since" ASC
      LIMIT ?
    `,
    {
      replacements: [collectiveId, limit],
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
        MIN(m.since) as since,
        ARRAY_AGG(DISTINCT m."role") as roles,
        COALESCE(SUM(t."netAmountInCollectiveCurrency"), 0) AS "totalAmountDonated",
        COALESCE(MAX(m.description), MAX(tier.name)) as description
      FROM
        "Collectives" mc
      INNER JOIN
        "Members" m ON m."MemberCollectiveId" = mc.id
      LEFT JOIN
        "Transactions" t
          ON t."type" = 'CREDIT'
          AND (t."FromCollectiveId" = mc.id OR t."UsingVirtualCardFromCollectiveId" = mc.id)
      CROSS JOIN LATERAL (
        SELECT name
        FROM "Tiers"
        WHERE id = m."TierId"
        ORDER BY "Tiers".amount DESC
        LIMIT 1
      ) AS tier
      WHERE
        m."TierId" = ?
      GROUP BY	  
        mc.id
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
