import models, { sequelize } from '../server/models';
import { parse as json2csv } from 'json2csv';
import fs from 'fs';
import Promise from 'bluebird';
import moment from 'moment';

const GoogleDrivePath = process.env.OC_GOOGLE_DRIVE || `${process.env.HOME}/Google\ Drive/Open\ Collective`;

if (!fs.existsSync(GoogleDrivePath)) {
  console.error('error');
  console.log(`Please make sure the Open Collective Drive is synchronized locally to ${GoogleDrivePath}.`);
  console.log('You can override the default location with the env variable OC_GOOGLE_DRIVE');
  process.exit(0);
}

const queries = [
  {
    filename: 'TopCollectivesByNewBackers.csv',
    query: `
    SELECT max(c.slug) as collective, max(c."createdAt") as "createdAt", count(*) as "totalNewBackers",
    max(c.website) as website, max(c."twitterHandle") as twitter, max(c.description) as description
    FROM "Members" m
    LEFT JOIN "Collectives" c ON m."CollectiveId" = c.id
    WHERE m."createdAt" > :startDate
      AND m."createdAt" < :endDate
      AND m.role='BACKER'
    GROUP BY "CollectiveId"
    ORDER BY "totalNewBackers" DESC
    `,
  },
  {
    filename: 'TopNewCollectivesByDonations.csv',
    query: `
  SELECT sum(amount)::float / 100 as "totalAmount", max(t.currency) as currency, max(c.slug) as collective,
  max(c.website) as website, max(c."twitterHandle") as twitter, max(c.description) as description
  FROM "Transactions" t
  LEFT JOIN "Collectives" c ON c.id = t."CollectiveId"
  WHERE t."createdAt" > :startDate
    AND c."createdAt" > :startDate
    AND t."createdAt" < :endDate
    AND c."createdAt" < :endDate
    AND t.type='CREDIT'
    AND t."platformFeeInHostCurrency" < 0
  GROUP BY t."CollectiveId"
  ORDER BY "totalAmount" DESC
  `,
  },
  {
    filename: 'Top100Backers.csv',
    query: `
  with res as (SELECT CONCAT('https://opencollective.com/', max(backer.slug)) as backer, sum(amount)::float / 100 as "amount",
  max(t.currency) as currency, string_agg(DISTINCT c.slug, ', ') AS "collectives supported", max(backer."twitterHandle") as twitter,
  max(backer.description) as description, max(backer.website) as website
  FROM "Transactions" t
  LEFT JOIN "Collectives" backer ON backer.id = t."FromCollectiveId"
  LEFT JOIN "Collectives" c ON c.id = t."CollectiveId"
  WHERE t."createdAt" > :startDate
    AND t."createdAt" < :endDate
    AND t.type='CREDIT'
    AND t."platformFeeInHostCurrency" < 0
    AND t."deletedAt" IS NULL
   GROUP BY t."FromCollectiveId"
   ORDER BY "amount" DESC)
   SELECT row_number() over(order by "amount" DESC) as "#", * from res LIMIT 100
   `,
  },
  {
    filename: 'transactions.csv',
    query: `
    SELECT
    t."createdAt", c.slug as "collective slug", t.type as "transaction type", t.amount::float / 100,
    t.currency, fc.slug as "from slug", fc.type as "from type", t.description, e.category as "expense category",
    h.slug as "host slug", t."hostCurrency", t."hostCurrencyFxRate",
    pm.service as "payment processor", pm.type as "payment method type",
    t."paymentProcessorFeeInHostCurrency"::float / 100 as "paymentProcessorFeeInHostCurrency",
    t."hostFeeInHostCurrency"::float / 100 as "hostFeeInHostCurrency",
    t."platformFeeInHostCurrency"::float / 100 as "platformFeeInHostCurrency"
    FROM "Transactions" t
    LEFT JOIN "Collectives" fc ON fc.id=t."FromCollectiveId"
    LEFT JOIN "Collectives" c ON c.id=t."CollectiveId"
    LEFT JOIN "Collectives" h ON h.id=t."HostCollectiveId"
    LEFT JOIN "PaymentMethods" pm ON pm.id=t."PaymentMethodId"
    LEFT JOIN "Expenses" e ON e.id=t."ExpenseId"
    WHERE t."createdAt" >= :startDate AND t."createdAt" < :endDate
      AND t."deletedAt" IS NULL
    ORDER BY t.id ASC
      `,
  },
];

const d = process.env.START_DATE ? new Date(process.env.START_DATE) : new Date();
d.setMonth(d.getMonth() - 1);

const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);

console.log('startDate', startDate, 'endDate', endDate);
let month = startDate.getMonth() + 1;
if (month < 10) {
  month = `0${month}`;
}

const path = `${GoogleDrivePath}/Open Data/${startDate.getFullYear()}-${month}`;
try {
  console.log('>>> mkdir', path);
  fs.mkdirSync(path);
} catch (e) {
  console.log('>>> path already exists');
}

async function run() {
  const lastTransaction = await models.Transaction.findOne({ order: [['id', 'DESC']] });
  if (new Date(lastTransaction.createdAt) < endDate) {
    console.log('The last transaction date must be newer that endDate');
    console.log('Make sure you have a recent data dump of the database locally.');
    console.log(`Last transaction date in ${process.env.PG_DATABASE}: ${lastTransaction.createdAt}`);
    process.exit(0);
  }

  await Promise.map(queries, async query => {
    const res = await sequelize.query(query.query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { startDate, endDate },
    });

    const data = res.map(row => {
      if (row.createdAt) {
        row.createdAt = moment(row.createdAt).format('YYYY-MM-DD HH:mm');
      }
      Object.keys(row).map(key => {
        if (row[key] === null) {
          row[key] = '';
        }
      });
      return row;
    });

    try {
      const csv = json2csv(data);
      fs.writeFileSync(`${path}/${query.filename}`, csv);
    } catch (err) {
      console.log(err);
    }
  });
  console.log('done');
  process.exit(0);
}

run();
