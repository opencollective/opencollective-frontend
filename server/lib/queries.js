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

const getTotalAnnualBudgetForHost = (HostCollectiveId) => {
  return sequelize.query(`
  WITH 
    "collectiveids" AS (
      SELECT id FROM "Collectives" WHERE "HostCollectiveId"=:HostCollectiveId AND "isActive"=true
    ),
    "monthlyOrdersWithAmountInHostCurrency" AS (
      SELECT o.id, MAX(o."CollectiveId") as "CollectiveId", MAX(t.currency) AS currency, MAX(t."amountInHostCurrency") as "amountInHostCurrency"
      FROM "Orders" o
      LEFT JOIN "Subscriptions" s ON o."SubscriptionId" = s.id
      LEFT JOIN "Transactions" t ON t."OrderId" = o.id
      WHERE s.interval = 'month' AND s."isActive" = true
        AND o."CollectiveId" IN (SELECT id FROM collectiveids)
        AND s."deletedAt" IS NULL
      GROUP BY o.id
    ),
    "yearlyAndOneTimeOrdersWithAmountInHostCurrency" AS (
      SELECT o.id, MAX(o."CollectiveId") as "CollectiveId", MAX(t.currency) AS currency, MAX(t."amountInHostCurrency") as "amountInHostCurrency"
      FROM "Orders" o
      LEFT JOIN "Subscriptions" s ON o."SubscriptionId" = s.id
      LEFT JOIN "Transactions" t ON t."OrderId" = o.id
      WHERE ((s.interval = 'year' AND s."isActive" = true) OR s.interval IS NULL)
        AND o."CollectiveId" IN (SELECT id FROM collectiveids)
        AND s."deletedAt" IS NULL
        AND t."createdAt" > (current_date - INTERVAL '12 months') 
      GROUP BY o.id
    )
 
  SELECT
    ( SELECT COALESCE(SUM("amountInHostCurrency") * 12, 0) FROM "monthlyOrdersWithAmountInHostCurrency" t )
    +
    ( SELECT COALESCE(SUM("amountInHostCurrency"), 0) FROM "yearlyAndOneTimeOrdersWithAmountInHostCurrency" t )
    +
    (SELECT
      COALESCE(SUM("amountInHostCurrency"),0) FROM "Transactions" t
      LEFT JOIN "Orders" o on t."OrderId" = o.id
      LEFT JOIN "Subscriptions" s ON o."SubscriptionId" = s.id
      WHERE t.type='CREDIT' AND t."CollectiveId" IN (SELECT id FROM collectiveids)
        AND t."deletedAt" IS NULL
        AND t."createdAt" > (current_date - INTERVAL '12 months')
        AND s.interval = 'month' AND s."isActive" IS FALSE AND s."deletedAt" IS NULL)
    "yearlyIncome"
  `, {
    replacements: { HostCollectiveId },
    type: sequelize.QueryTypes.SELECT
  })
  .then(res => Math.round(parseInt(res[0].yearlyIncome, 10)));
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
      WHERE t.type='CREDIT' AND t."CollectiveId" != 1
        AND t."deletedAt" IS NULL
        AND s.interval = 'month'
        AND s."isActive" IS TRUE
        AND s."deletedAt" IS NULL)
    +
    (SELECT
      COALESCE(SUM(${generateFXConversionSQL()}),0) FROM "Transactions" t
      LEFT JOIN "Orders" d ON t."OrderId" = d.id
      LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
      WHERE t.type='CREDIT' AND t."CollectiveId" != 1
        AND t."deletedAt" IS NULL
        AND t."createdAt" > (current_date - INTERVAL '12 months') 
        AND ((s.interval = 'year' AND s."isActive" IS TRUE AND s."deletedAt" IS NULL) OR s.interval IS NULL))
    +
    (SELECT
      COALESCE(SUM(${generateFXConversionSQL()}),0) FROM "Transactions" t
      LEFT JOIN "Orders" d on t."OrderId" = d.id
      LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
      WHERE t.type='CREDIT' AND t."CollectiveId" != 1
        AND t."deletedAt" IS NULL
        AND t."createdAt" > (current_date - INTERVAL '12 months')
        AND s.interval = 'month' AND s."isActive" IS FALSE AND s."deletedAt" IS NULL)
    "yearlyIncome"
  `, {
    type: sequelize.QueryTypes.SELECT
  })
  .then(res => Math.round(parseInt(res[0].yearlyIncome, 10)));
};

/**
 * Get the total of donations across the platform
 */
const getTotalDonations = () => {
  return sequelize.query(`
    SELECT SUM(${generateFXConversionSQL()}) AS "totalDonationsInUSD"
    FROM "Transactions"
    WHERE type='CREDIT' AND "PaymentMethodId" IS NOT NULL
  `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
  {
    type: sequelize.QueryTypes.SELECT
  })
  .then(res => Math.round(res[0].totalDonationsInUSD));
};

/**
 * Returns the total amount of donations made by collective type (USER/ORGANIZATION/COLLECTIVE) (in cents in the currency of the CollectiveId)
 * @param {*} CollectiveId 
 */
const getTotalDonationsByCollectiveType = (CollectiveId) => {
  return sequelize.query(`
    SELECT MAX(c.type) as type, SUM("netAmountInCollectiveCurrency") as "totalDonations" FROM "Transactions" t LEFT JOIN "Collectives" c ON t."FromCollectiveId" = c.id WHERE c.type='USER' AND t."CollectiveId"=:CollectiveId and t.type='CREDIT' GROUP BY c.type ORDER BY "totalDonations" DESC
  `, {
    replacements: { CollectiveId },
    type: sequelize.QueryTypes.SELECT
  })
}

/**
 * Returns an array with the top (default 3) donors for a given CollectiveId (where the money comes from)
 * @param {*} CollectiveId 
 * @param {*} options 
 */
const getTopDonorsForCollective = (CollectiveId, options = {}) => {
  options.limit = options.limit || 3;
  return sequelize.query(`
    SELECT MAX(c.slug) as slug, MAX(c.image) as image, MAX(c.name) as name, SUM("netAmountInCollectiveCurrency") as "totalDonations" FROM "Transactions" t LEFT JOIN "Collectives" c ON t."FromCollectiveId" = c.id WHERE t."CollectiveId"=:CollectiveId and t.type='CREDIT' GROUP BY c.id ORDER BY "totalDonations" DESC LIMIT :limit
  `, {
    replacements: { CollectiveId, limit: options.limit },
    type: sequelize.QueryTypes.SELECT
  });
}

/**
 * Returns an array with the top (default 3) vendors for a given CollectiveId (where the money goes)
 * @param {*} CollectiveId 
 * @param {*} options 
 */
const getTopVendorsForCollective = (CollectiveId, options = {}) => {
  options.limit = options.limit || 3;
  return sequelize.query(`
    SELECT MAX(c.slug) as slug, MAX(c.image) as image, MAX(c.name) as name, SUM("netAmountInCollectiveCurrency") as "totalExpenses" FROM "Transactions" t LEFT JOIN "Collectives" c ON t."FromCollectiveId" = c.id WHERE t."CollectiveId"=:CollectiveId and t.type='DEBIT' GROUP BY c.id ORDER BY "totalExpenses" ASC LIMIT :limit
  `, {
    replacements: { CollectiveId, limit: options.limit },
    type: sequelize.QueryTypes.SELECT
  });
}

/**
 * Get the top expense categories for a given collective with total amount and total number of expenses
 * @param {*} CollectiveId 
 * @param {*} options 
 */
const getTopExpenseCategories = (CollectiveId, options = {}) => {
  options.limit = options.limit || 3;
  const since = (options.since) ? `AND e."createdAt" >= '${options.since.toISOString()}'`: '';
  const until = (options.until) ? `AND e."createdAt" < '${options.until.toISOString()}'` : '';

  return sequelize.query(`
    SELECT category, COUNT(*) as "count", SUM("amount") as "totalExpenses" FROM "Expenses" e WHERE "CollectiveId"=:CollectiveId ${since} ${until} GROUP BY category ORDER BY "totalExpenses" DESC LIMIT :limit
  `, {
    replacements: { CollectiveId, limit: options.limit },
    type: sequelize.QueryTypes.SELECT
  });  
}

/**
 * Returns the top backers (Collectives) in a given time range in given tags
 * E.g. top backers in open source collectives last June
 */
const getTopBackers = (since, until, tags, limit) => {

  const sinceClause = (since) ? `AND t."createdAt" >= '${since.toISOString()}'`: '';
  const untilClause = (until) ? `AND t."createdAt" < '${until.toISOString()}'` : '';
  const tagsClause = (tags) ? `AND collective.tags && $tags` : ''; // && operator means "overlaps"

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
    LEFT JOIN "Collectives" collective ON collective.id = t."CollectiveId"
    WHERE 
      t.type='CREDIT'
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
 * Get top collectives ordered by available balance
 */
const getChildCollectivesWithBalance = (ParentCollectiveId, options) => {
  const orderDirection = options.orderDirection || "DESC";
  const orderBy = options.orderBy || "balance";
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  return sequelize.query(`
    with "balance" AS (
      SELECT t."CollectiveId", SUM("netAmountInCollectiveCurrency") as "balance"
      FROM "Collectives" c
      LEFT JOIN "Transactions" t ON t."CollectiveId" = c.id
      WHERE
        c.type = 'COLLECTIVE'
        AND c."isActive" IS TRUE
        AND c."ParentCollectiveId"=:ParentCollectiveId
        AND c."deletedAt" IS NULL
        AND t.type='CREDIT'
        GROUP BY t."CollectiveId"
    )
    select c.*, td.* FROM "balance" td LEFT JOIN "Collectives" c on td."CollectiveId" = c.id
    ORDER BY ${orderBy} ${orderDirection} NULLS LAST LIMIT ${limit} OFFSET ${offset}
  `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
  {
    replacements: { ParentCollectiveId },
    model: models.Collective
  });
};

/**
 * Get top collectives based on total donations
 */
const getCollectivesByTag = (tag, limit, excludeList, minTotalDonationInCents, randomOrder, orderBy, orderDir, offset) => {
  let tagClause = '';
  let excludeClause = '';
  let minTotalDonationInCentsClause = '';
  let orderClause = 'BY "totalDonations"';
  const orderDirection = (orderDir === 'asc') ? 'ASC' : 'DESC';
  if (orderBy) {
    orderClause = `BY ${ orderBy }`;
  } else if (randomOrder) {
    orderClause = 'BY random()';
  }
  if (excludeList && excludeList.length > 0) {
    excludeClause = `AND c.id not in (${excludeList})`;
  }
  if (minTotalDonationInCents && minTotalDonationInCents > 0) {
    minTotalDonationInCentsClause = `WHERE "totalDonations" >= ${minTotalDonationInCents}`
  } else {
    minTotalDonationInCentsClause = ''
  }

  if (tag) {
    tagClause = 'AND c.tags && $tag'; // && operator means "overlaps", e.g. ARRAY[1,4,3] && ARRAY[2,1] == true
  }

  if (typeof tag === 'string') {
    tag = [ tag ];
  }

  return sequelize.query(`
    with "totalDonations" AS (
      SELECT t."CollectiveId", SUM("netAmountInCollectiveCurrency") as "totalDonations"
      FROM "Collectives" c
      LEFT JOIN "Transactions" t ON t."CollectiveId" = c.id
      WHERE
        c.type = 'COLLECTIVE'
        AND c."isActive" IS TRUE
        ${excludeClause}
        AND c."deletedAt" IS NULL
        AND t.type='CREDIT'
        AND t."PaymentMethodId" IS NOT NULL
        ${tagClause}
        GROUP BY t."CollectiveId"
    )
    select c.*, td.* FROM "totalDonations" td LEFT JOIN "Collectives" c on td."CollectiveId" = c.id ${minTotalDonationInCentsClause}
    ORDER ${orderClause} ${orderDirection} NULLS LAST LIMIT ${limit} OFFSET ${offset || 0}
  `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
  {
    bind: { tag },
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
 * Returns top sponsors ordered by total amount donated and number of collectives they sponsor
 */
const getTopSponsors = () => {
  return sequelize.query(`
    SELECT
      MAX(c.id), MAX(c.name) as name, MAX(c.slug) as slug, MAX(c.mission) as mission, MAX(c.description) as description, MAX(c.image) as image, "CollectiveId", -SUM(amount) as "totalDonations", MAX(c.currency) as currency, COUNT(DISTINCT t."FromCollectiveId") as collectives
    FROM "Collectives" c LEFT JOIN "Transactions" t ON t."CollectiveId" = c.id
    WHERE c.type = 'ORGANIZATION' AND t.type='DEBIT' AND t.currency='USD' AND "PaymentMethodId" IS NOT NULL
    GROUP BY t."CollectiveId"
    ORDER BY "totalDonations" DESC, collectives DESC LIMIT :limit
    `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
    {
      replacements: { limit: 6 },
      type: sequelize.QueryTypes.SELECT
  })
  .then(sponsors => sponsors.map(sponsor => {
    sponsor.publicUrl = `${config.host.website}/${sponsor.slug}`
    return sponsor;
  }));
};

const getMembersOfCollectiveWithRole = (CollectiveIds) => {
  const collectiveids = (typeof CollectiveIds === 'number') ? [CollectiveIds] : CollectiveIds;
  return sequelize.query(`
    WITH memberships AS (
      SELECT c.*, MAX(u.email) as email, string_agg(distinct m.role,',') as roles
      FROM "Collectives" c
        LEFT JOIN "Members" m ON c.id = m."MemberCollectiveId"
        LEFT JOIN "Users" u ON u."CollectiveId" = c.id
      WHERE m."CollectiveId" IN (:collectiveids) AND m."deletedAt" IS NULL AND c."deletedAt" IS NULL
      GROUP BY c.id
    )
    SELECT (CASE WHEN roles LIKE '%HOST%' THEN 'HOST' WHEN roles LIKE '%ADMIN%' THEN 'ADMIN' ELSE 'BACKER' END) as role, * FROM memberships
`, {
    replacements: { collectiveids },
    type: sequelize.QueryTypes.SELECT,
    model: models.Collective
  });
}

/**
 * Returns all the users of a collective with their `totalDonations` and `role` (HOST/ADMIN/BACKER)
 */
const getBackersOfCollectiveWithTotalDonations = (CollectiveIds, options) => {
  const { until } = options;
  const untilCondition = (table) => until ? `AND ${table}."createdAt" < '${until.toISOString().toString().substr(0,10)}'` : '';

  let types, filterByMemberollectiveType = '';
  if (options.type) {
    types = (typeof options.type === 'string') ? options.type.split(',') : options.type;
    filterByMemberollectiveType = `AND c.type IN (:types)`
  }

  const collectiveids = (typeof CollectiveIds === 'number') ? [CollectiveIds] : CollectiveIds;
  return sequelize.query(`
    WITH stats AS (
      SELECT
        max("FromCollectiveId") as "FromCollectiveId",
        SUM("amountInHostCurrency") as "totalDonations",
        max("createdAt") as "lastDonation",
        min("createdAt") as "firstDonation"
      FROM "Transactions" t
      WHERE t."CollectiveId" IN (:collectiveids) AND t.amount >= 0 ${untilCondition('t')}
      GROUP BY t."FromCollectiveId"
    )
    SELECT
      member."MemberCollectiveId",
      member.role,
      max(member.id) as "MemberId",
      max(member."TierId") as "TierId",
      max(member."createdAt") as "createdAt",
      max(c.id) as id,
      max(c.type) as type,
      max(c."HostCollectiveId") as "HosCollectiveId",
      max(c.name) as name,
      max(u."firstName") as "firstName",
      max(u."lastName") as "lastName",
      max(c.slug) as slug,
      max(c.image) as image,
      max(c.website) as website,
      max(u.email) as email,
      max(c."twitterHandle") as "twitterHandle",
      max(s."totalDonations") as "totalDonations",
      max(s."firstDonation") as "firstDonation",
      max(s."lastDonation") as "lastDonation"
    FROM "Collectives" c
    LEFT JOIN stats s ON c.id = s."FromCollectiveId"
    LEFT JOIN "Members" member ON c.id = member."MemberCollectiveId"
    LEFT JOIN "Users" u ON c.id = u."CollectiveId"
    WHERE member."CollectiveId" IN (:collectiveids)
    AND member.role = :role
    AND member."deletedAt" IS NULL ${untilCondition('member')}
    ${filterByMemberollectiveType}
    GROUP BY member.role, member."MemberCollectiveId"
    ORDER BY "totalDonations" DESC, "createdAt" ASC
    LIMIT :limit OFFSET :offset
  `.replace(/\s\s+/g,' '), // this is to remove the new lines and save log space.
  {
    replacements: {
      collectiveids,
      role: options.role || 'BACKER',
      limit: options.limit || 100,
      offset: options.offset || 0,
      types
    },
    type: sequelize.QueryTypes.SELECT,
    model: models.Collective
  });
};

const getTotalNumberOfActiveCollectives = () => {
  return sequelize.query(`
    SELECT COUNT(DISTINCT("CollectiveId")) as count
    FROM "Transactions" t
      LEFT JOIN "Collectives" c ON t."CollectiveId" = c.id
    WHERE c.type='COLLECTIVE'
  `, {
    type: sequelize.QueryTypes.SELECT
  })
  .then(res => parseInt(res[0].count));
}

const getTotalNumberOfDonors = () => {
  return sequelize.query(`
    SELECT COUNT(DISTINCT("FromCollectiveId")) as count
    FROM "Transactions" t
      LEFT JOIN "Collectives" c ON t."CollectiveId" = c.id
    WHERE c.type='COLLECTIVE'
  `, {
    type: sequelize.QueryTypes.SELECT
  })
  .then(res => parseInt(res[0].count));
}

export default {
  getTotalDonationsByCollectiveType,
  getTotalAnnualBudgetForHost,
  getTopDonorsForCollective,
  getTopVendorsForCollective,
  getTopExpenseCategories,
  getTotalDonations,
  getTotalAnnualBudget,
  getMembersOfCollectiveWithRole,
  getBackersOfCollectiveWithTotalDonations,
  getTopSponsors,
  getTopBackers,
  getCollectivesByTag,
  getTotalNumberOfActiveCollectives,
  getTotalNumberOfDonors,
  getChildCollectivesWithBalance,
  getUniqueCollectiveTags
};

