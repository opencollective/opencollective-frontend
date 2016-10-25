import models, {sequelize} from '../models';

/*
* Hacky way to do currency conversion on Leaderboard
*/
const generateFXConversionSQL = (aggregate) => {
  let currencyColumn = "currency";
  let amountColumn = "amount";

  if (aggregate) {
    currencyColumn = 'MAX(g.currency)';
    amountColumn = 'SUM("amount")';
  }

  // FXRate as of 6/27/2016
  const fxConversion = [
    ['USD', 1.0],
    ['EUR', 0.90],
    ['GBP', 0.73],
    ['MXN', 18.92],
    ['SEK', 8.48],
    ['AUD', 1.34],
    ['INR', 67.89],
    ['CAD', 1.3]
  ];

  let sql = 'CASE ';
  sql += fxConversion.map(currency => `WHEN ${currencyColumn} = '${currency[0]}' THEN ${amountColumn} / ${currency[1]}`).join('\n');
  sql += 'ELSE 0 END';

  return sql;
};

const getTotalDonations = () => {
  return sequelize.query(`
    SELECT SUM(${generateFXConversionSQL()}) AS "totalDonationsInUSD"
    FROM "Transactions"
    WHERE amount > 0 AND "PaymentMethodId" IS NOT NULL
  `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
  {
    type: sequelize.QueryTypes.SELECT
  })
  .then(res => Math.round(res[0].totalDonationsInUSD));
};

/**
 * Returns the top backers in a given time range in given tags
 * E.g. top backers in open source collectives last June
 */
const getTopBackers = (since, until, tags, limit) => {

  const sinceClause = (since) ? `AND t."createdAt" >= '${since.toISOString()}'`: '';
  const untilClause = (until) ? `AND t."createdAt" < '${until.toISOString()}'` : '';
  const tagsClause = (tags) ? `AND g.tags && $tags` : ''; // && operator means "overlaps"

  return sequelize.query(`
    SELECT MAX(u.id) as id, MAX(u."firstName") as "firstName", MAX(u."lastName") as "lastName", MAX(u.username) as username, MAX(u.website) as "website", MAX(u."twitterHandle") as "twitterHandle", MAX(u.avatar) as "avatar", SUM("amount") as "totalDonations", MAX(t.currency) as "currency"
    FROM "Transactions" t
    LEFT JOIN "Users" u ON u.id = t."UserId"
    LEFT JOIN "Groups" g ON g.id = t."GroupId"
    WHERE 
      t.amount > 0
      ${sinceClause}
      ${untilClause}
      ${tagsClause}      
    GROUP BY "UserId" 
    ORDER BY "totalDonations" DESC
    LIMIT ${limit}
    `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
    {
      bind: { tags: tags || [] },
      model: models.User
    });
  }

/**
 * Get top collectives based on total donations
 */
const getGroupsByTag = (tag, limit, excludeList, minTotalDonation, randomOrder, orderBy, orderDir, offset) => {
  let tagClause = '';
  let excludeClause = '';
  let minTotalDonationClause = '';
  let orderClause = 'BY t."totalDonations"';
  const orderDirection = (orderDir === 'asc') ? 'ASC' : 'DESC';
  if (orderBy) {
    orderClause = `BY ${ orderBy }`;
  } else if (randomOrder) {
    orderClause = 'BY random()';
  }
  if (excludeList && excludeList.length > 0) {
    excludeClause = `AND g.id not in (${excludeList})`;
  }
  if (minTotalDonation && minTotalDonation > 0) {
    minTotalDonationClause = `t."totalDonations" >= ${minTotalDonation} AND`
  } else {
    minTotalDonationClause = ''
  }

  if (tag) {
    tagClause = 'g.tags && $tag AND'; // && operator means "overlaps", e.g. ARRAY[1,4,3] && ARRAY[2,1] == true
  }

  return sequelize.query(`
    WITH "totalDonations" AS (
      SELECT "GroupId", SUM(amount) as "totalDonations", MAX(currency) as currency, COUNT(DISTINCT "GroupId") as collectives FROM "Transactions" WHERE amount > 0 AND currency='USD' AND "PaymentMethodId" IS NOT NULL GROUP BY "GroupId"
    )
    SELECT g.id, g.name, g.slug, g.mission, g.logo, g."backgroundImage", g.settings, t."totalDonations", t.currency, t.collectives
    FROM "Groups" g LEFT JOIN "totalDonations" t ON t."GroupId" = g.id
    WHERE ${minTotalDonationClause} ${tagClause} g."deletedAt" IS NULL ${excludeClause}
    ORDER ${orderClause} ${orderDirection} NULLS LAST LIMIT ${limit} OFFSET ${offset || 0}
  `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
  {
    bind: { tag: [tag] },
    model: models.Group
  });
};

/**
* Get list of all unique tags for groups.
*/
const getUniqueGroupTags = () => {
  return sequelize.query('SELECT DISTINCT UNNEST(tags) FROM "Groups" WHERE ARRAY_LENGTH(tags, 1) > 0')
  .then(results => results[0].map(x => x.unnest).sort())
}

/**
 * Returns top sponsors ordered by number of collectives they sponsor and total amount donated
 */
const getTopSponsors = () => {
  return sequelize.query(`
    WITH "totalDonations" AS (
      SELECT "UserId", SUM(amount) as "totalDonations", MAX(currency) as currency, COUNT(DISTINCT "GroupId") as collectives FROM "Transactions" WHERE amount > 0 AND currency='USD' AND "PaymentMethodId" IS NOT NULL GROUP BY "UserId"
    )
    SELECT u.id, u."firstName", u."lastName", u.username, u.mission, u.avatar as logo, t."totalDonations", t.currency, t.collectives
    FROM "totalDonations" t LEFT JOIN "Users" u ON t."UserId" = u.id
    WHERE t."totalDonations" > 100 AND u."isOrganization" IS TRUE
    ORDER BY t.collectives DESC, "totalDonations" DESC LIMIT :limit
    `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
    {
      replacements: { limit: 6 },
      type: sequelize.QueryTypes.SELECT
  });
};

/**
 * Returns all the users of a group with their `totalDonations` and `role` (HOST/MEMBER/BACKER)
 */
const getUsersFromGroupWithTotalDonations = (GroupIds) => {
  const groupids = (typeof GroupIds === 'number') ? [GroupIds] : GroupIds;
  return sequelize.query(`
    WITH total_donations AS (
      SELECT
        max("UserId") as "UserId",
        SUM(amount/100) as amount
      FROM "Donations" d
      WHERE d."GroupId" IN (:groupids) AND d.amount >= 0
      GROUP BY "UserId"
    ), last_donation AS (
      SELECT
        max("UserId") as "UserId",
        max("updatedAt") as "updatedAt"
      FROM "Transactions" t
      WHERE t."GroupId" IN (:groupids) AND t.amount >= 0
      GROUP BY "UserId"
    )
    SELECT
      ug."UserId" as id,
      ug."createdAt" as "createdAt",
      concat_ws(' ', u."firstName", u."lastName") as name,
      u."firstName" as "firstName",
      u."lastName" as "lastName",
      u.username as username,
      ug.role as role,
      u.avatar as avatar,
      u.website as website,
      u.email as email,
      u."twitterHandle" as "twitterHandle",
      td.amount as "totalDonations",
      ld."updatedAt" as "lastDonation"
    FROM "UserGroups" ug
    LEFT JOIN "Users" u ON u.id = ug."UserId"
    LEFT JOIN total_donations td ON td."UserId" = ug."UserId"
    LEFT JOIN last_donation ld on ld."UserId" = ug."UserId"
    WHERE ug."GroupId" IN (:groupids)
    AND ug."deletedAt" IS NULL
    ORDER BY "totalDonations" DESC, ug."createdAt" ASC
  `.replace(/\s\s+/g,' '), // this is to remove the new lines and save log space.
  {
    replacements: { groupids },
    type: sequelize.QueryTypes.SELECT
  });
};

const getLeaderboard = () => {
return sequelize.query(`
    SELECT
      MAX(g.name) as name,
      COUNT(t.id) as "donationsCount",
      SUM(amount) as "totalAmount",
      MAX(g.currency) as currency,
      to_char(MAX(t."createdAt"), 'Month DD') as "latestDonation",
      MAX(g.slug) as slug,
      MAX(g.logo) as logo,
      ${generateFXConversionSQL(true)} AS "amountInUSD"
    FROM "Transactions" t
    LEFT JOIN "Groups" g ON g.id = t."GroupId"
    WHERE t."createdAt" > current_date - INTERVAL '30' day
      AND t.amount > 0
      AND t."UserId"
      NOT IN (10,39,40,43,45,46)
    GROUP BY t."GroupId"
    ORDER BY "amountInUSD" DESC`,
  {
    type: sequelize.QueryTypes.SELECT
  });
};

export default {
  getTotalDonations,
  getUsersFromGroupWithTotalDonations,
  getLeaderboard,
  getTopSponsors,
  getTopBackers,
  getGroupsByTag,
  getUniqueGroupTags
};

