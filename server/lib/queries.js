import Promise from 'bluebird';
import config from 'config';
import { get, pick } from 'lodash';

import { memoize } from './cache';
import { convertToCurrency } from './currency';
import models, { sequelize, Op } from '../models';

const twoHoursInSeconds = 2 * 60 * 60;

/*
 * Hacky way to do currency conversion
 */
const generateFXConversionSQL = async aggregate => {
  let currencyColumn = 't.currency';
  let amountColumn = 't."netAmountInCollectiveCurrency"';

  if (aggregate) {
    currencyColumn = 'MAX(t.currency)';
    amountColumn = 'SUM("t."netAmountInCollectiveCurrency"")';
  }

  const currencies = ['AUD', 'CAD', 'EUR', 'GBP', 'INR', 'MXN', 'SEK', 'USD', 'UYU'];

  const result = await Promise.all(
    currencies.map(async currency => {
      const amount = await convertToCurrency(1, 'USD', currency);
      return `WHEN ${currencyColumn} = '${currency}' THEN ${amountColumn} / ${amount}`;
    }),
  );

  return `CASE ${result.join('\n')}ELSE 0 END`;
};

const getHosts = async args => {
  let hostConditions = '';
  if (args.tags && args.tags.length > 0) {
    hostConditions = 'AND c.tags && $tags';
  }
  if (args.currency && args.currency.length === 3) {
    hostConditions += ' AND c.currency=$currency';
  }
  if (args.onlyOpenHosts) {
    hostConditions += ` AND c."settings" #>> '{apply}' IS NOT NULL AND (c."settings" #>> '{apply}') != 'false'`;
  }

  const query = `
    WITH all_hosts AS (
      SELECT max(c.id) as "HostCollectiveId", count(m.id) as count
      FROM "Collectives" c
      LEFT JOIN "Members" m ON m."MemberCollectiveId" = c.id AND m.role = 'HOST' AND m."deletedAt" IS NULL
      WHERE c."deletedAt" IS NULL ${hostConditions}
      GROUP BY c.id
      HAVING count(m.id) >= $minNbCollectivesHosted
    ) SELECT c.*, (SELECT COUNT(*) FROM all_hosts) AS __hosts_count__, SUM(all_hosts.count) as __members_count__
    FROM "Collectives" c INNER JOIN all_hosts ON all_hosts."HostCollectiveId" = c.id
    GROUP BY c.id
    ORDER BY ${args.orderBy === 'collectives' ? '__members_count__' : args.orderBy} ${args.orderDirection}
    LIMIT $limit
    OFFSET $offset
  `;

  const result = await sequelize.query(query, {
    bind: {
      tags: args.tags || [],
      currency: args.currency,
      limit: args.limit,
      offset: args.offset,
      minNbCollectivesHosted: args.minNbCollectivesHosted,
    },
    type: sequelize.QueryTypes.SELECT,
    model: models.Collective,
    mapToModel: true,
  });

  return { collectives: result, total: get(result[0], 'dataValues.__hosts_count__', 0) };
};

const getTotalAnnualBudgetForHost = HostCollectiveId => {
  return sequelize
    .query(
      `
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
  `,
      {
        replacements: { HostCollectiveId },
        type: sequelize.QueryTypes.SELECT,
      },
    )
    .then(res => Math.round(parseInt(res[0].yearlyIncome, 10)));
};

const getTotalAnnualBudget = async () => {
  const fxConversionSQL = await generateFXConversionSQL();

  return sequelize
    .query(
      `
  SELECT
    (SELECT
      COALESCE(SUM(${fxConversionSQL} * 12),0)
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
      COALESCE(SUM(${fxConversionSQL}),0) FROM "Transactions" t
      LEFT JOIN "Orders" d ON t."OrderId" = d.id
      LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
      WHERE t.type='CREDIT' AND t."CollectiveId" != 1
        AND t."deletedAt" IS NULL
        AND t."createdAt" > (current_date - INTERVAL '12 months')
        AND ((s.interval = 'year' AND s."isActive" IS TRUE AND s."deletedAt" IS NULL) OR s.interval IS NULL))
    +
    (SELECT
      COALESCE(SUM(${fxConversionSQL}),0) FROM "Transactions" t
      LEFT JOIN "Orders" d on t."OrderId" = d.id
      LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
      WHERE t.type='CREDIT' AND t."CollectiveId" != 1
        AND t."deletedAt" IS NULL
        AND t."createdAt" > (current_date - INTERVAL '12 months')
        AND s.interval = 'month' AND s."isActive" IS FALSE AND s."deletedAt" IS NULL)
    "yearlyIncome"
  `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    )
    .then(res => Math.round(parseInt(res[0].yearlyIncome, 10)));
};

/**
 * Returns the total amount of donations made by collective type (USER/ORGANIZATION/COLLECTIVE) (in cents in the currency of the CollectiveId)
 * @param {*} CollectiveId
 */
const getTotalDonationsByCollectiveType = CollectiveId => {
  return sequelize.query(
    `
    SELECT MAX(c.type) as type, SUM("netAmountInCollectiveCurrency") as "totalDonations" FROM "Transactions" t LEFT JOIN "Collectives" c ON t."FromCollectiveId" = c.id WHERE c.type='USER' AND t."CollectiveId"=:CollectiveId and t.type='CREDIT' GROUP BY c.type ORDER BY "totalDonations" DESC
  `,
    {
      replacements: { CollectiveId },
      type: sequelize.QueryTypes.SELECT,
    },
  );
};

/**
 * Returns an array with the top (default 3) donors for a given CollectiveId (where the money comes from)
 * @param {*} CollectiveId
 * @param {*} options
 */
const getTopDonorsForCollective = (CollectiveId, options = {}) => {
  options.limit = options.limit || 3;
  return sequelize.query(
    `
    SELECT MAX(c.slug) as slug, MAX(c.image) as image, MAX(c.name) as name, SUM("netAmountInCollectiveCurrency") as "totalDonations" FROM "Transactions" t LEFT JOIN "Collectives" c ON t."FromCollectiveId" = c.id WHERE t."CollectiveId"=:CollectiveId and t.type='CREDIT' GROUP BY c.id ORDER BY "totalDonations" DESC LIMIT :limit
  `,
    {
      replacements: { CollectiveId, limit: options.limit },
      type: sequelize.QueryTypes.SELECT,
    },
  );
};

/**
 * Returns an array with the top (default 3) expense submitters by amount for
 * a given CollectiveId.
 * @param {*} CollectiveId
 * @param {*} options
 */
const getTopExpenseSubmitters = (CollectiveId, options = {}) => {
  options.limit = options.limit || 3;
  const since = options.since ? `AND t."createdAt" >= '${options.since.toISOString()}'` : '';
  const until = options.until ? `AND t."createdAt" < '${options.until.toISOString()}'` : '';
  return sequelize.query(
    `
    SELECT MAX(c.slug) as slug, MAX(c."twitterHandle") as "twitterHandle", MAX(c.image) as image, MAX(c.name) as name, SUM("netAmountInCollectiveCurrency") as "totalExpenses"
    FROM "Transactions" t LEFT JOIN "Collectives" c ON t."FromCollectiveId" = c.id
    WHERE t."CollectiveId"=:CollectiveId
      AND t.type='DEBIT'
      AND t."deletedAt" IS NULL
      AND t."ExpenseId" IS NOT NULL
      ${since} ${until}
    GROUP BY c.id ORDER BY "totalExpenses" ASC LIMIT :limit
  `,
    {
      replacements: { CollectiveId, limit: options.limit },
      type: sequelize.QueryTypes.SELECT,
    },
  );
};

/**
 * Get the top expense categories for a given collective with total amount and total number of expenses
 * @param {*} CollectiveId
 * @param {*} options
 */
const getTopExpenseCategories = (CollectiveId, options = {}) => {
  options.limit = options.limit || 3;
  const since = options.since ? `AND e."createdAt" >= '${options.since.toISOString()}'` : '';
  const until = options.until ? `AND e."createdAt" < '${options.until.toISOString()}'` : '';

  return sequelize.query(
    `
    SELECT category, COUNT(*) as "count", SUM("amount") as "totalExpenses"
    FROM "Expenses" e
    WHERE "CollectiveId"=:CollectiveId AND e.status!='REJECTED' ${since} ${until}
    GROUP BY category
    ORDER BY "totalExpenses" DESC LIMIT :limit
  `,
    {
      replacements: { CollectiveId, limit: options.limit },
      type: sequelize.QueryTypes.SELECT,
    },
  );
};

/**
 * Returns the top backers (Collectives) in a given time range in given tags
 * E.g. top backers in open source collectives last June
 */
const getTopBackers = (since, until, tags, limit) => {
  const sinceClause = since ? `AND t."createdAt" >= '${since.toISOString()}'` : '';
  const untilClause = until ? `AND t."createdAt" < '${until.toISOString()}'` : '';
  const tagsClause = tags ? 'AND collective.tags && $tags' : ''; // && operator means "overlaps"

  return sequelize.query(
    `
    SELECT
      MAX(fromCollective.id) as id,
      MAX(fromCollective.slug) as slug,
      MAX(fromCollective.name) as name,
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
      model: models.Collective,
    },
  );
};

/**
 * Get top collectives ordered by available balance
 */
const getCollectivesWithBalance = async (where = {}, options) => {
  const orderDirection = options.orderDirection || 'DESC';
  const orderBy = options.orderBy || 'balance';
  const limit = options.limit || 20;
  const offset = options.offset || 0;

  let whereCondition = '';
  Object.keys(where).forEach(key => {
    if (key === 'tags') {
      whereCondition += 'AND c.tags && $tags '; // && operator means "overlaps", e.g. ARRAY[1,4,3] && ARRAY[2,1] == true
      where.tags = where.tags[Op.overlap];
    } else {
      whereCondition += `AND c."${key}"=$${key} `;
    }
  });

  const params = {
    bind: where,
    model: models.Collective,
  };

  const allFields = 'c.*, td.*';

  /* This version doesn't include limit/offset */
  const sql = fields =>
    `
    with "balance" AS (
      SELECT t."CollectiveId", SUM("netAmountInCollectiveCurrency") as "balance"
      FROM "Collectives" c
      LEFT JOIN "Transactions" t ON t."CollectiveId" = c.id
      WHERE
        c.type = 'COLLECTIVE'
        AND t."deletedAt" IS NULL
        AND c."isActive" IS TRUE
        ${whereCondition}
        AND c."deletedAt" IS NULL
        GROUP BY t."CollectiveId"
    )
    SELECT ${fields} FROM "Collectives" c
    LEFT JOIN "balance" td ON td."CollectiveId" = c.id
    WHERE c."isActive" IS TRUE
    ${whereCondition}
    AND c."deletedAt" IS NULL
    GROUP BY c.id, td."CollectiveId", td.balance
    ORDER BY ${orderBy} ${orderDirection} NULLS LAST
  `.replace(/\s\s+/g, ' '); // remove the new lines and save log space

  const [[totalResult], collectives] = await Promise.all([
    sequelize.query(`${sql('COUNT(c.*) OVER() as "total"')} LIMIT 1`, params),
    sequelize.query(`${sql(allFields)} LIMIT ${limit} OFFSET ${offset}`, params),
  ]);

  const total = get(totalResult, 'dataValues.total', 0);
  return { total, collectives };
};

/**
 * Get top collectives based on total donations
 */
const getCollectivesByTag = async (
  tag,
  limit,
  excludeList,
  minTotalDonationInCents,
  randomOrder,
  orderBy,
  orderDir,
  offset,
) => {
  let tagClause = '';
  let excludeClause = '';
  let minTotalDonationInCentsClause = '';
  let orderClause = 'BY "totalDonations"';
  const orderDirection = orderDir === 'asc' ? 'ASC' : 'DESC';
  if (orderBy) {
    orderClause = `BY ${orderBy}`;
  } else if (randomOrder) {
    orderClause = 'BY random()';
  }
  if (excludeList && excludeList.length > 0) {
    excludeClause = `AND c.id not in (${excludeList})`;
  }
  if (minTotalDonationInCents && minTotalDonationInCents > 0) {
    minTotalDonationInCentsClause = `WHERE "totalDonations" >= ${minTotalDonationInCents}`;
  } else {
    minTotalDonationInCentsClause = '';
  }

  if (tag) {
    tagClause = 'AND c.tags && $tag'; // && operator means "overlaps", e.g. ARRAY[1,4,3] && ARRAY[2,1] == true
  }

  if (typeof tag === 'string') {
    tag = [tag];
  }

  const params = {
    bind: { tag },
    model: models.Collective,
  };

  const allFields = 'c.*, td.*';

  const sql = fields =>
    `
    WITH "totalDonations" AS (
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
    select ${fields} FROM "totalDonations" td LEFT JOIN "Collectives" c on td."CollectiveId" = c.id ${minTotalDonationInCentsClause}
    ORDER ${orderClause} ${orderDirection} NULLS LAST
  `.replace(/\s\s+/g, ' '); // this is to remove the new lines and save log space.

  const [[totalResult], collectives] = await Promise.all([
    sequelize.query(`${sql('COUNT(c.*) OVER() as "total"')} LIMIT 1`, params),
    sequelize.query(`${sql(allFields)} LIMIT ${limit} OFFSET ${offset || 0}`, params),
  ]);

  const total = totalResult ? get(totalResult, 'dataValues.total') : 0;

  return { total, collectives };
};

/**
 * Get list of all unique tags for collectives.
 */
const getUniqueCollectiveTags = () => {
  return sequelize
    .query(
      `
    WITH
      tags as (
        SELECT UNNEST(tags) as tag FROM "Collectives" WHERE type='COLLECTIVE' AND ARRAY_LENGTH(tags, 1) > 0
      ),
      top_tags as (
        SELECT tag, count(*) as count FROM tags GROUP BY tag ORDER BY count DESC
      )
    SELECT * FROM top_tags WHERE count > 20 ORDER BY tag ASC
  `,
    )
    .then(results => results[0].map(x => x.tag));
};

/**
 * Get list of all unique batches for collective.
 * Returns an array of objects matching `PaymentMethodBatchInfo`
 */
const getVirtualCardBatchesForCollective = async collectiveId => {
  return sequelize.query(
    `
    SELECT
      :collectiveId::varchar || '-virtualcard-' || COALESCE(pm.batch, ' __UNGROUPED__ ') AS id,
      :collectiveId AS "collectiveId",
      'virtualcard' AS type,
      pm.batch AS name,
      COUNT(pm.id) as count
    FROM "PaymentMethods" pm
    INNER JOIN "PaymentMethods" spm ON pm."SourcePaymentMethodId" = spm.id
    WHERE spm."CollectiveId" = :collectiveId
    GROUP BY pm.batch
    ORDER BY pm.batch ASC
  `,
    {
      raw: true,
      type: sequelize.QueryTypes.SELECT,
      replacements: { collectiveId },
    },
  );
};

/**
 * Returns top sponsors in the past 3 months ordered by total amount donated and number of collectives they sponsor
 * (excluding open source collective id 9805 and sponsors that have sponsored only one collective)
 */
const getTopSponsors = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return sequelize
    .query(
      `
      WITH
      "topSponsorsLast3Months" as (
        SELECT "CollectiveId", MAX(c.slug) as slug, MAX(c.type) as type, MAX(c.name) as name, MAX(c.description) as description, MAX(c.image) as image, -SUM(amount) as "totalDonationsLast3months", MAX(c.currency) as currency, COUNT(DISTINCT t."FromCollectiveId") as collectives
        FROM "Collectives" c LEFT JOIN "Transactions" t ON t."CollectiveId" = c.id
        WHERE c.type = 'ORGANIZATION'
          AND t.type='DEBIT'
          AND t.currency='USD'
          AND t."platformFeeInHostCurrency" < 0
          AND c.id != 9805
          AND t."createdAt" > :since
        GROUP BY t."CollectiveId"
        ORDER BY "totalDonationsLast3months" DESC, collectives DESC LIMIT 20
      ), 
      "topSponsorsTotalDonations" as (
        SELECT -sum(amount) as "totalDonations", max(t."CollectiveId") as "CollectiveId"
        FROM "Transactions" t WHERE t."CollectiveId" IN (
          SELECT s."CollectiveId" FROM "topSponsorsLast3Months" s WHERE s.collectives > 1 LIMIT 6
        )
        GROUP BY t."CollectiveId"
      )
      SELECT d."totalDonations", s."totalDonationsLast3months", s.*
      FROM "topSponsorsLast3Months" s
      LEFT JOIN "topSponsorsTotalDonations" d ON d."CollectiveId" = s."CollectiveId"
      WHERE collectives > 1
      ORDER BY d."totalDonations" DESC NULLS LAST
      LIMIT :limit
    `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
      {
        replacements: { limit: 6, since: d },
        type: sequelize.QueryTypes.SELECT,
      },
    )
    .then(sponsors =>
      sponsors.map(sponsor => {
        sponsor.publicUrl = `${config.host.website}/${sponsor.slug}`;
        return sponsor;
      }),
    );
};

/**
 * Returns collectives ordered by average monthly spending in the last 90 days
 * excluding:
 * - id 9805 (open source collective host)
 * - id 1 (opencollective-company)
 * - id 51 and 9804 (wwcode host)
 */
const getCollectivesOrderedByMonthlySpendingQuery = async ({
  where = {},
  orderDirection = 'ASC',
  limit = 0,
  offset = 0,
}) => {
  const whereStatement = Object.keys(where).reduce((statement, key) => `${statement} AND c."${key}"=:${key}`, '');

  const d = new Date();
  const since = new Date(d.setDate(d.getDate() - 90));

  const params = {
    replacements: { ...where, since },
    model: models.Collective,
  };

  const sql = fields =>
    `
    SELECT c.id,
    (CASE
      WHEN (DATE_PART('day', max(t."createdAt") - min(t."createdAt")) < 30) THEN -SUM(amount)
      WHEN (DATE_PART('day', max(t."createdAt") - min(t."createdAt")) < 60) THEN -SUM(amount) / 2
      ELSE -SUM(amount) / 3
    END) as "monthlySpending",
    ${fields}
    FROM "Collectives" c
    LEFT JOIN "Transactions" t on t."CollectiveId" = c.id
    WHERE c."isActive" IS TRUE
      AND c."deletedAt" IS NULL
      AND c.id NOT IN (1, 51, 9804, 9805)
      AND t."deletedAt" IS NULL
      AND t."type" = 'DEBIT'
      AND t."createdAt" >= :since
      ${whereStatement}
    GROUP BY c.id
    ORDER BY "monthlySpending" ${orderDirection} NULLS LAST
  `.replace(/\s\s+/g, ' ');

  // If we use this query to get the monthlySpending of one single collective, we don't need to perform a count query
  const countPromise =
    typeof where.id === 'number'
      ? Promise.resolve(1)
      : sequelize
          .query(`${sql('COUNT(c.*) OVER() as "total"')} LIMIT 1`, params)
          .then(res => res.length === 1 && res[0].dataValues.total);

  const [total, collectives] = await Promise.all([
    countPromise,
    sequelize.query(`${sql('c.*')} LIMIT ${limit} OFFSET ${offset}`, params),
  ]);

  return { total, collectives };
};

const getMembersOfCollectiveWithRole = CollectiveIds => {
  const collectiveids = typeof CollectiveIds === 'number' ? [CollectiveIds] : CollectiveIds;
  return sequelize.query(
    `
    WITH memberships AS (
      SELECT c.*, MAX(u.email) as email, string_agg(distinct m.role,',') as roles
      FROM "Collectives" c
        LEFT JOIN "Members" m ON c.id = m."MemberCollectiveId"
        LEFT JOIN "Users" u ON u."CollectiveId" = c.id
      WHERE m."CollectiveId" IN (:collectiveids) AND m."deletedAt" IS NULL AND c."deletedAt" IS NULL
      GROUP BY c.id
    )
    SELECT (CASE WHEN roles LIKE '%HOST%' THEN 'HOST' WHEN roles LIKE '%ADMIN%' THEN 'ADMIN' ELSE 'BACKER' END) as role, * FROM memberships
`,
    {
      replacements: { collectiveids },
      type: sequelize.QueryTypes.SELECT,
      model: models.Collective,
    },
  );
};

/**
 * Returns all the members of a collective with their `totalDonations` and
 * `role` (HOST/ADMIN/BACKER)
 */
const getMembersWithTotalDonations = (where, options = {}) => {
  const untilCondition = table => {
    let condition = '';
    if (options.since) {
      condition += `AND ${table}."createdAt" >= '${options.since
        .toISOString()
        .toString()
        .substr(0, 10)}'`;
    }
    if (options.until) {
      condition += `AND ${table}."createdAt" < '${options.until
        .toISOString()
        .toString()
        .substr(0, 10)}'`;
    }
    return condition;
  };

  const roleCond = where.role ? `AND member.role = '${where.role}'` : '';

  let types,
    filterByMemberCollectiveType = '';
  if (options.type) {
    types = typeof options.type === 'string' ? options.type.split(',') : options.type;
    filterByMemberCollectiveType = 'AND c.type IN (:types)';
  }

  let memberCondAttribute, transactionType, groupBy;
  if (where.CollectiveId) {
    memberCondAttribute = 'CollectiveId';
    transactionType = 'CREDIT';
    groupBy = 'MemberCollectiveId';
  } else if (where.MemberCollectiveId) {
    memberCondAttribute = 'MemberCollectiveId';
    transactionType = 'DEBIT';
    groupBy = 'CollectiveId';
  }
  const collectiveids =
    typeof where[memberCondAttribute] === 'number' ? [where[memberCondAttribute]] : where[memberCondAttribute];

  const selector = `member."${groupBy}" as "${groupBy}", max(member."${memberCondAttribute}") as "${memberCondAttribute}"`;

  // Stats query builder to get stats about transactions
  const buildTransactionsStatsQuery = sourceCollectiveIdColName => `
    SELECT
      "${sourceCollectiveIdColName}",
      ${
        transactionType === 'DEBIT' ? 'SUM("netAmountInCollectiveCurrency") * -1' : 'SUM("amount")'
      } as "totalDonations",
      max("createdAt") as "lastDonation",
      min("createdAt") as "firstDonation"
    FROM "Transactions" t
    WHERE t."CollectiveId" IN (:collectiveids)
    AND t.amount ${transactionType === 'CREDIT' ? '>=' : '<='} 0 ${untilCondition('t')}
    AND t."deletedAt" IS NULL
    GROUP BY t."${sourceCollectiveIdColName}"
  `;

  const query = `
    WITH
      DirectStats AS (
        ${buildTransactionsStatsQuery('FromCollectiveId')}
      ),
      IndirectStats AS (
        ${buildTransactionsStatsQuery('UsingVirtualCardFromCollectiveId')}
      )
    SELECT
      ${selector},
      member.role,
      max(member.id) as "MemberId",
      max(member."TierId") as "TierId",
      max(member."createdAt") as "createdAt",
      max(c.id) as id,
      max(c.type) as type,
      max(c."HostCollectiveId") as "HostCollectiveId",
      max(c."ParentCollectiveId") as "ParentCollectiveId",
      max(c.name) as name,
      max(c.description) as description,
      max(u."firstName") as "firstName",
      max(u."lastName") as "lastName",
      max(c.slug) as slug,
      max(c.image) as image,
      max(c.website) as website,
      max(c.currency) as currency,
      max(u.email) as email,
      max(c."twitterHandle") as "twitterHandle",
      COALESCE(max(dstats."totalDonations"), 0) as "directDonations",
      COALESCE(max(istats."totalDonations"), 0) as "donationsThroughEmittedVirtualCards",
      COALESCE(max(dstats."totalDonations"), 0) +  COALESCE(max(istats."totalDonations"), 0) as "totalDonations",
      LEAST(Max(dstats."firstDonation"), Max(istats."firstDonation")) AS "firstDonation",
      GREATEST(Max(dstats."lastDonation"), Max(istats."lastDonation")) AS "lastDonation"
    FROM "Collectives" c
    LEFT JOIN DirectStats dstats ON c.id = dstats."FromCollectiveId"
    LEFT JOIN IndirectStats istats ON c.id = istats."UsingVirtualCardFromCollectiveId"
    LEFT JOIN "Members" member ON c.id = member."${groupBy}"
    LEFT JOIN "Users" u ON c.id = u."CollectiveId"
    WHERE member."${memberCondAttribute}" IN (:collectiveids)
    ${roleCond}
    AND member."deletedAt" IS NULL ${untilCondition('member')}
    ${filterByMemberCollectiveType}
    GROUP BY member.role, member."${groupBy}"
    ORDER BY "totalDonations" DESC, "createdAt" ASC
    LIMIT :limit OFFSET :offset
  `;

  return sequelize.query(
    query.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
    {
      replacements: {
        collectiveids,
        limit: options.limit || 100000, // we should reduce this to 100 by default but right now Webpack depends on it
        offset: options.offset || 0,
        types,
      },
      type: sequelize.QueryTypes.SELECT,
      model: models.Collective,
    },
  );
};

const getMembersWithBalance = (where, options = {}) => {
  const { until } = options;
  const untilCondition = table =>
    until
      ? `AND ${table}."createdAt" < '${until
          .toISOString()
          .toString()
          .substr(0, 10)}'`
      : '';
  const roleCond = where.role ? `AND member.role = '${where.role}'` : '';

  let types,
    filterByMemberCollectiveType = '';
  if (options.type) {
    types = typeof options.type === 'string' ? options.type.split(',') : options.type;
    filterByMemberCollectiveType = 'AND c.type IN (:types)';
  }

  let whereCondition = '';
  Object.keys(pick(where, ['HostCollectiveId', 'ParentCollectiveId'])).forEach(key => {
    whereCondition += `AND c."${key}"=:${key} `;
  });

  let memberCondAttribute, groupBy;
  if (where.CollectiveId) {
    memberCondAttribute = 'CollectiveId';
    groupBy = 'MemberCollectiveId';
  } else if (where.MemberCollectiveId) {
    memberCondAttribute = 'MemberCollectiveId';
    groupBy = 'CollectiveId';
  }
  const collectiveids =
    typeof where[memberCondAttribute] === 'number' ? [where[memberCondAttribute]] : where[memberCondAttribute];
  const selector = `member."${groupBy}" as "${groupBy}", max(member."${memberCondAttribute}") as "${memberCondAttribute}"`;

  // xdamman: this query can be optimized by first computing all the memberships
  // and only computing the balance for the member.collective selected #TODO
  const query = `
    with "balance" AS (
      SELECT t."CollectiveId", SUM("netAmountInCollectiveCurrency") as "balance"
      FROM "Collectives" c
      LEFT JOIN "Transactions" t ON t."CollectiveId" = c.id
      WHERE
        c.type = 'COLLECTIVE'
        AND c."isActive" IS TRUE
        ${whereCondition}
        AND c."deletedAt" IS NULL
        GROUP BY t."CollectiveId"
    )
    SELECT
      ${selector},
      member.role,
      max(member.id) as "MemberId",
      max(member."TierId") as "TierId",
      max(member."createdAt") as "createdAt",
      max(c.id) as id,
      max(c.type) as type,
      max(c."HostCollectiveId") as "HostCollectiveId",
      max(c."ParentCollectiveId") as "ParentCollectiveId",
      max(c.name) as name,
      max(u."firstName") as "firstName",
      max(u."lastName") as "lastName",
      max(c.slug) as slug,
      max(c.image) as image,
      max(c.website) as website,
      max(c.currency) as currency,
      max(u.email) as email,
      max(c."twitterHandle") as "twitterHandle",
      COALESCE(max(b."balance"), 0) as "balance"
    FROM "Collectives" c
    LEFT JOIN balance b ON c.id = b."CollectiveId"
    LEFT JOIN "Members" member ON c.id = member."${groupBy}"
    LEFT JOIN "Users" u ON c.id = u."CollectiveId"
    WHERE member."${memberCondAttribute}" IN (:collectiveids)
    ${roleCond}
    ${whereCondition}
    AND member."deletedAt" IS NULL ${untilCondition('member')}
    ${filterByMemberCollectiveType}
    GROUP BY member.role, member."${groupBy}"
    ORDER BY "balance" DESC, "createdAt" ASC
    LIMIT :limit OFFSET :offset
  `;

  const replacements = {
    ...where,
    collectiveids,
    limit: options.limit || 100000, // we should reduce this to 100 by default but right now Webpack depends on it
    offset: options.offset || 0,
    types,
  };

  return sequelize.query(
    query.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
    {
      replacements,
      type: sequelize.QueryTypes.SELECT,
      model: models.Collective,
    },
  );
};

const getTotalNumberOfActiveCollectives = (since, until) => {
  const sinceClause = since ? `AND t."createdAt" >= '${since.toISOString()}'` : '';
  const untilClause = until ? `AND t."createdAt" < '${until.toISOString()}'` : '';
  return sequelize
    .query(
      `
    SELECT COUNT(DISTINCT("CollectiveId")) as count
    FROM "Transactions" t
      LEFT JOIN "Collectives" c ON t."CollectiveId" = c.id
    WHERE c.type='COLLECTIVE' ${sinceClause} ${untilClause}
  `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    )
    .then(res => parseInt(res[0].count));
};

const getTotalNumberOfDonors = () => {
  return sequelize
    .query(
      `
    SELECT COUNT(DISTINCT("FromCollectiveId")) as count
    FROM "Transactions" t
      LEFT JOIN "Collectives" c ON t."CollectiveId" = c.id
    WHERE c.type='COLLECTIVE'
  `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    )
    .then(res => parseInt(res[0].count));
};

const getCollectivesWithMinBackersQuery = async ({
  backerCount = 10,
  orderBy = 'createdAt',
  orderDirection = 'ASC',
  limit = 0,
  offset = 0,
  where = {},
}) => {
  if (where.type) {
    delete where.type;
  }

  const whereStatement = Object.keys(where).reduce((statement, key) => `${statement} AND c."${key}"=$${key}`, '');
  const params = {
    bind: where,
    model: models.Collective,
  };

  const sql = fields =>
    `
    with "actives" as (
      SELECT c.id
      FROM "Collectives" c
      LEFT JOIN "Members" m ON m."CollectiveId" = c.id
      WHERE
        c.type = 'COLLECTIVE'
        AND c."isActive" IS TRUE
        AND c."deletedAt" IS NULL
        AND m.role = 'BACKER'
        ${whereStatement}
        GROUP BY c.id
        HAVING count(m."MemberCollectiveId") >= ${backerCount}
    )
    SELECT ${fields} from "Collectives" c
    INNER JOIN "actives" a on a.id = c.id
    ORDER BY c."${orderBy}" ${orderDirection} NULLS LAST
  `.replace(/\s\s+/g, ' ');

  const [[totalResult], collectives] = await Promise.all([
    sequelize.query(`${sql('COUNT(c.*) OVER() as "total"')} LIMIT 1`, params),
    sequelize.query(`${sql('c.*')} LIMIT ${limit} OFFSET ${offset}`, params),
  ]);

  const total = totalResult ? get(totalResult, 'dataValues.total') : 0;

  return { total, collectives };
};

const serializeCollectivesResult = JSON.stringify;

const unserializeCollectivesResult = string => {
  const result = JSON.parse(string);
  result.collectives = result.collectives.map(collective => models.Collective.build(collective));
  return result;
};

const getCollectivesOrderedByMonthlySpending = memoize(getCollectivesOrderedByMonthlySpendingQuery, {
  key: 'collectives_ordered_by_monthly_spending',
  maxAge: twoHoursInSeconds,
  serialize: serializeCollectivesResult,
  unserialize: unserializeCollectivesResult,
});

const getCollectivesWithMinBackers = memoize(getCollectivesWithMinBackersQuery, {
  key: 'collectives_with_min_backers',
  maxAge: twoHoursInSeconds,
  serialize: serializeCollectivesResult,
  unserialize: unserializeCollectivesResult,
});

const queries = {
  getHosts,
  getCollectivesOrderedByMonthlySpending,
  getCollectivesOrderedByMonthlySpendingQuery,
  getTotalDonationsByCollectiveType,
  getTotalAnnualBudgetForHost,
  getTopDonorsForCollective,
  getTopExpenseSubmitters,
  getTopExpenseCategories,
  getTotalAnnualBudget,
  getMembersOfCollectiveWithRole,
  getMembersWithTotalDonations,
  getMembersWithBalance,
  getTopSponsors,
  getTopBackers,
  getCollectivesByTag,
  getTotalNumberOfActiveCollectives,
  getTotalNumberOfDonors,
  getCollectivesWithBalance,
  getUniqueCollectiveTags,
  getVirtualCardBatchesForCollective,
  getCollectivesWithMinBackers,
  getCollectivesWithMinBackersQuery,
};

export default queries;
