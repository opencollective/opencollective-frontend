import models, {sequelize} from '../models';
import currencies from '../constants/currencies'
import config from 'config';

/*
* Hacky way to do currency conversion
*/
const generateFXConversionSQL = (aggregate) => {
  let currencyColumn = "t.currency";
  let amountColumn = "t.\"netAmountInCollectiveCurrency\"";

  if (aggregate) {
    currencyColumn = 'MAX(t.currency)';
    amountColumn = 'SUM("t.\"netAmountInCollectiveCurrency\"")';
  }

  const fxConversion = [];
  for (const currency in currencies) {
    fxConversion.push([currency, currencies[currency].fxrate]);
  }

  let sql = 'CASE ';
  sql += fxConversion.map(currency => `WHEN ${currencyColumn} = '${currency[0]}' THEN ${amountColumn} / ${currency[1]}`).join('\n');
  sql += 'ELSE 0 END';

  return sql;
};

const getTotalAnnualBudget = () => {
  return sequelize.query(`
  SELECT
    (SELECT
      COALESCE(SUM(${generateFXConversionSQL()} * 12),0)
      FROM "Subscriptions" s
      LEFT JOIN "Orders" d ON s.id = d."SubscriptionId"
      LEFT JOIN "Transactions" t
      ON (s.id = d."SubscriptionId"
        AND t.id = (SELECT MAX(id) from "Transactions" t where t."OrderId" = d.id))
      WHERE t.amount > 0 AND t."ToCollectiveId" != 1
        AND t."deletedAt" IS NULL
        AND s.interval = 'month'
        AND s."isActive" IS TRUE
        AND s."deletedAt" IS NULL)
    +
    (SELECT
      COALESCE(SUM(${generateFXConversionSQL()}),0) FROM "Transactions" t
      LEFT JOIN "Orders" d ON t."OrderId" = d.id
      LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
      WHERE t.amount > 0 AND t."ToCollectiveId" != 1
        AND t."deletedAt" IS NULL
        AND t."createdAt" > (current_date - INTERVAL '12 months') 
        AND ((s.interval = 'year' AND s."isActive" IS TRUE AND s."deletedAt" IS NULL) OR s.interval IS NULL))
    +
    (SELECT
      COALESCE(SUM(${generateFXConversionSQL()}),0) FROM "Transactions" t
      LEFT JOIN "Orders" d on t."OrderId" = d.id
      LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
      WHERE t.amount > 0 AND t."ToCollectiveId" != 1
        AND t."deletedAt" IS NULL
        AND t."createdAt" > (current_date - INTERVAL '12 months')
        AND s.interval = 'month' AND s."isActive" IS FALSE AND s."deletedAt" IS NULL)
    "yearlyIncome"
  `, {
    type: sequelize.QueryTypes.SELECT
  })
  .then(res => Math.round(parseInt(res[0].yearlyIncome, 10)));
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
 * Returns the top backers (Collectives) in a given time range in given tags
 * E.g. top backers in open source collectives last June
 */
const getTopBackers = (since, until, tags, limit) => {

  const sinceClause = (since) ? `AND t."createdAt" >= '${since.toISOString()}'`: '';
  const untilClause = (until) ? `AND t."createdAt" < '${until.toISOString()}'` : '';
  const tagsClause = (tags) ? `AND toCollective.tags && $tags` : ''; // && operator means "overlaps"

  return sequelize.query(`
    SELECT
      MAX(fromCollective.id) as id,
      MAX(fromCollective.slug) as slug,
      MAX(fromCollective.website) as "website",
      MAX(fromCollective."twitterHandle") as "twitterHandle",
      MAX(fromCollective.image) as "image",
      SUM("amount") as "totalDonations",
      MAX(t.currency) as "currency"
    FROM "Transactions" t
    LEFT JOIN "Collectives" fromCollective ON fromCollective.id = t."FromCollectiveId"
    LEFT JOIN "Collectives" toCollective ON toCollective.id = t."ToCollectiveId"
    WHERE 
      t.amount > 0
      ${sinceClause}
      ${untilClause}
      ${tagsClause}      
    GROUP BY "FromCollectiveId" 
    ORDER BY "totalDonations" DESC
    LIMIT ${limit}
    `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
    {
      bind: { tags: tags || [] },
      model: models.Collective
    });
  }

/**
 * Get top collectives based on total donations
 */
const getCollectivesByTag = (tag, limit, excludeList, minTotalDonationInCents, randomOrder, orderBy, orderDir, offset) => {
  let tagClause = '';
  let excludeClause = '';
  let minTotalDonationInCentsClause = '';
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
  if (minTotalDonationInCents && minTotalDonationInCents > 0) {
    minTotalDonationInCentsClause = `t."totalDonations" >= ${minTotalDonationInCents} AND`
  } else {
    minTotalDonationInCentsClause = ''
  }

  if (tag) {
    tagClause = 'g.tags && $tag AND'; // && operator means "overlaps", e.g. ARRAY[1,4,3] && ARRAY[2,1] == true
  }

  return sequelize.query(`
    WITH "totalDonations" AS (
      SELECT "ToCollectiveId", SUM(amount) as "totalDonations", MAX(currency) as currency, COUNT(DISTINCT "ToCollectiveId") as collectives FROM "Transactions" WHERE amount > 0 AND "PaymentMethodId" IS NOT NULL GROUP BY "ToCollectiveId"
    )
    SELECT g.id, g.name, g.slug, g.mission, g.image, g."backgroundImage", g.currency, g.settings, g.data, t."totalDonations", t.collectives
    FROM "Collectives" g LEFT JOIN "totalDonations" t ON t."ToCollectiveId" = g.id
    WHERE ${minTotalDonationInCentsClause} ${tagClause} g."deletedAt" IS NULL ${excludeClause} AND g."isActive" IS TRUE
    ORDER ${orderClause} ${orderDirection} NULLS LAST LIMIT ${limit} OFFSET ${offset || 0}
  `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
  {
    bind: { tag: [tag] },
    model: models.Collective
  });
};

/**
* Get list of all unique tags for collectives.
*/
const getUniqueCollectiveTags = () => {
  return sequelize.query('SELECT DISTINCT UNNEST(tags) FROM "Collectives" WHERE ARRAY_LENGTH(tags, 1) > 0')
  .then(results => results[0].map(x => x.unnest).sort())
}

/**
 * Returns top sponsors ordered by number of collectives they sponsor and total amount donated
 */
const getTopSponsors = () => {
  return sequelize.query(`
    WITH "totalDonations" AS (
      SELECT "CreatedByUserId", SUM(amount) as "totalDonations", MAX(currency) as currency, COUNT(DISTINCT "ToCollectiveId") as collectives FROM "Transactions" WHERE amount > 0 AND currency='USD' AND "PaymentMethodId" IS NOT NULL GROUP BY "CreatedByUserId"
    )
    SELECT u.id, u."firstName", u."lastName", c.slug as username, c.mission, c.description, c.image, t."totalDonations", t.currency, t.collectives
    FROM "totalDonations" t
    LEFT JOIN "Users" u ON t."CreatedByUserId" = u.id
    LEFT JOIN "Collectives" c ON u."CollectiveId" = c.id
    WHERE t."totalDonations" > 100 IS TRUE
    ORDER BY t.collectives DESC, "totalDonations" DESC LIMIT :limit
    `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
    {
      replacements: { limit: 6 },
      type: sequelize.QueryTypes.SELECT
  })
  .then(sponsors => sponsors.map(sponsor => {
    sponsor.publicUrl = `${config.host.website}/${sponsor.username}`
    return sponsor;
  }));
};

const getMembersOfCollectiveWithRole = (CollectiveIds) => {
  const collectiveids = (typeof CollectiveIds === 'number') ? [CollectiveIds] : CollectiveIds;
  return sequelize.query(`
    SELECT c.*, max(m.role)
    FROM "Collectives" c LEFT JOIN "Members" m ON c.id = m."MemberCollectiveId"
    WHERE m."CollectiveId" IN (:collectiveids) AND m."deletedAt" IS NULL AND c."deletedAt" IS NULL
    GROUP BY c.id
  `, {
    replacements: { collectiveids },
    type: sequelize.QueryTypes.SELECT,
    model: models.Collective
  });
}

/**
 * Returns all the users of a collective with their `totalDonations` and `role` (HOST/ADMIN/BACKER)
 */
const getBackersOfCollectiveWithTotalDonations = (CollectiveIds, until) => {
  const untilCondition = (table) => until ? `AND ${table}."createdAt" < '${until.toISOString().toString().substr(0,10)}'` : '';

  const collectiveids = (typeof CollectiveIds === 'number') ? [CollectiveIds] : CollectiveIds;
  return sequelize.query(`
    WITH stats AS (
      SELECT
        max("FromCollectiveId") as "FromCollectiveId",
        SUM("amountInTxnCurrency") as "totalDonations",
        max("createdAt") as "lastDonation",
        min("createdAt") as "firstDonation"
      FROM "Transactions" t
      WHERE t."ToCollectiveId" IN (:collectiveids) AND t.amount >= 0 ${untilCondition('t')}
      GROUP BY t."FromCollectiveId"
    )
    SELECT
      max(c.id) as id,
      max(member."createdAt") as "createdAt",
      max(c.name) as name,
      max(u."firstName") as "firstName",
      max(u."lastName") as "lastName",
      max(c.slug) as slug,
      member.role as role,
      max(c.image) as image,
      max(c.website) as website,
      max(u.email) as email,
      max(c."twitterHandle") as "twitterHandle",
      max(s."totalDonations") as "totalDonations",
      max(s."firstDonation") as "firstDonation",
      max(s."lastDonation") as "lastDonation"
    FROM "Users" u
    LEFT JOIN "Collectives" c ON c.id = u."CollectiveId"
    LEFT JOIN stats s ON c.id = s."FromCollectiveId"
    LEFT JOIN "Members" member ON c.id = member."MemberCollectiveId"
    WHERE member."CollectiveId" IN (:collectiveids)
    AND member.role = 'BACKER'
    AND member."deletedAt" IS NULL ${untilCondition('member')}
    GROUP BY member.role, c.id
    ORDER BY "totalDonations" DESC, "createdAt" ASC
  `.replace(/\s\s+/g,' '), // this is to remove the new lines and save log space.
  {
    replacements: { collectiveids },
    type: sequelize.QueryTypes.SELECT,
    model: models.Collective
  });
};

export default {
  getTotalDonations,
  getTotalAnnualBudget,
  getMembersOfCollectiveWithRole,
  getBackersOfCollectiveWithTotalDonations,
  getTopSponsors,
  getTopBackers,
  getCollectivesByTag,
  getUniqueCollectiveTags
};

