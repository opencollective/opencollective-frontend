#!/usr/bin/env node
import '../../server/env';

// Only run on the first of the year
const today = new Date();
if (process.env.NODE_ENV === 'production' && today.getDate() !== 1 && today.getMonth() !== 0) {
  console.log('NODE_ENV is production and today is not the first of year, script aborted!');
  process.exit();
}

process.env.PORT = 3066;

import models, { sequelize, Op } from '../../server/models';
import _ from 'lodash';
import Promise from 'bluebird';
import { formatCurrency, formatArrayToString, formatCurrencyObject } from '../../server/lib/utils';
import emailLib from '../../server/lib/email';
import queries from '../../server/lib/queries';

const d = process.env.START_DATE ? new Date(process.env.START_DATE) : new Date();
const startDate = new Date(`${d.getFullYear() - 1}`);
const endDate = new Date(`${d.getFullYear()}`);
const year = startDate.getFullYear();

console.log('startDate', startDate, 'endDate', endDate);

let platformStats,
  totalUsersProcessed = 0,
  totalUsersSkipped = 0;

const GetCollectiveTransactionsQuery = `
with "CollectiveTransactions" as (
  SELECT
    "CollectiveId",
    MAX("HostCollectiveId") as "HostCollectiveId",
    SUM("amountInHostCurrency") as "amountInHostCurrency",
    MAX("hostCurrency") as "hostCurrency",
    SUM("platformFeeInHostCurrency") as "platformFeeInHostCurrency",
    MAX("hostFeeInHostCurrency") as "hostFeeInHostCurrency",
    MAX("paymentProcessorFeeInHostCurrency") as "paymentProcessorFeeInHostCurrency"
  FROM "Transactions"
  WHERE "FromCollectiveId"=:FromCollectiveId AND amount > 0 AND "deletedAt" IS NULL
  AND "createdAt" >= :startDate AND "createdAt" < :endDate
  GROUP BY "CollectiveId"
)
SELECT
  ut.*,
  host.slug as "hostSlug",
  host.name as "hostName",
  host.image as "hostLogo", host."twitterHandle" as "hostTwitterHandle", host.description as "hostDescription", host.mission as "hostMission",
  c.slug, c.name, c.mission, c.description, c.image, c."backgroundImage", c."twitterHandle", c.settings, c.data
FROM "CollectiveTransactions" ut
LEFT JOIN "Collectives" c ON ut."CollectiveId" = c.id
LEFT JOIN "Collectives" host ON ut."HostCollectiveId" = host.id
WHERE c.type = 'COLLECTIVE'
`;

const buildTweet = (fromCollective, collectives, totalDonations) => {
  let tweet;
  const totalCollectives = Object.keys(collectives).length;
  const collectivesNames = [],
    collectivesDonationsNames = [];
  for (const slug in collectives) {
    const collective = collectives[slug];
    const collectiveName = collective.twitterHandle ? `@${collective.twitterHandle}` : collective.name;
    collectivesNames.push(collectiveName);
    collectivesDonationsNames.push(
      `${formatCurrency(collective.totalDonations, collective.currency)} across ${collectiveName}`,
    );
  }
  const pronoun = fromCollective.type === 'USER' ? 'I' : 'we';
  if (totalCollectives > 2) {
    tweet = `🎁 In ${year}, ${pronoun} have contributed a total of ${formatCurrencyObject(
      totalDonations,
    )} across ${totalCollectives} collectives`;
    const listCollectives = formatArrayToString(collectivesNames);
    if (`${tweet}: ${listCollectives}`.length < 120) {
      tweet = `${tweet}: ${listCollectives}`;
    }
  } else if (totalCollectives === 1) {
    tweet = `🎁 In ${year}, ${pronoun} have contributed ${collectivesDonationsNames[0].replace(
      ' to ',
      ' to the ',
    )} collective`;
  } else {
    tweet = `🎁 In ${year}, ${pronoun} have contributed ${formatArrayToString(collectivesDonationsNames)}'s collective`;
  }

  return tweet;
};

const getPlatformStats = () => {
  return Promise.props({
    totalCollectives: queries.getTotalNumberOfActiveCollectives(startDate, endDate),
    totalAnnualBudget: queries.getTotalAnnualBudget(),
  });
};

const processCollective = collective => {
  return sequelize
    .query(GetCollectiveTransactionsQuery, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { FromCollectiveId: collective.id, startDate, endDate },
    })
    .then(transactions => {
      if (!transactions || transactions.length === 0) {
        totalUsersSkipped++;
        return Promise.reject(`No transaction for ${collective.slug}, skipping`);
      }
      console.log('>>> processing collective', collective.slug);
      totalUsersProcessed++;
      const hosts = {
        opencollective: { name: 'Platform fees' },
        stripe: { name: 'Credit Card Processing Fees (Stripe)' },
      };
      const totalCollectives = transactions.length;
      const totalDonations = {};
      const collectivesBySlug = {};
      transactions.forEach(row => {
        if (!row.hostName) {
          return console.log('>>> no hostname for', row);
        }
        if (typeof hosts[row.hostSlug] === 'undefined') {
          hosts[row.hostSlug] = {
            slug: row.hostSlug,
            name: row.hostName.trim() || row.hostSlug,
            image: row.hostLogo,
            twitterHandle: row.hostTwitterHandle,
            description: row.hostDescription || row.hostMission,
            collectivesBySlug: {},
          };
        }

        collectivesBySlug[row.slug] = {
          slug: row.slug,
          name: row.name || row.slug,
          description: row.mission || row.description,
          image: row.image,
          backgroundImage:
            row.backgroundImage || 'https://opencollective.com/public/images/collectives/default-header-bg.jpg',
          twitterHandle: row.twitterHandle,
          settings: row.settings,
          data: row.data,
          totalDonations: Number(row.amountInHostCurrency),
          tier: 'total contributed',
          currency: row.hostCurrency,
        };

        hosts[row.hostSlug].collectivesBySlug[row.slug] = collectivesBySlug[row.slug];

        if (typeof totalDonations[row.hostCurrency] === 'undefined') {
          totalDonations[row.hostCurrency] = 0;
        }

        _.set(hosts, [row.hostSlug, 'totalFees', row.hostCurrency], 0);
        _.set(hosts, ['stripe', 'totalFees', row.hostCurrency], 0);
        _.set(hosts, ['opencollective', 'totalFees', row.hostCurrency], 0);

        totalDonations[row.hostCurrency] += Number(row.amountInHostCurrency);
        hosts[row.hostSlug]['totalFees'][row.hostCurrency] += Number(row.hostFeeInHostCurrency);
        hosts['opencollective']['totalFees'][row.hostCurrency] += Number(row.platformFeeInHostCurrency);
        hosts['stripe']['totalFees'][row.hostCurrency] += Number(row.paymentProcessorFeeInHostCurrency);
      });

      for (const hostSlug in hosts) {
        if (!hosts[hostSlug].collectivesBySlug) {
          continue;
        }
        for (const collectiveSlug in hosts[hostSlug].collectivesBySlug) {
          hosts[hostSlug].collectives = hosts[hostSlug].collectives || [];
          hosts[hostSlug].collectives.push(hosts[hostSlug].collectivesBySlug[collectiveSlug]);
        }
        hosts[hostSlug].collectives.sort((a, b) => {
          if (a.totalDonations > b.totalDonations) {
            return -1;
          } else {
            return 1;
          }
        });
      }

      const fees = {
        stripe: hosts['stripe'].totalFees,
        opencollective: hosts['opencollective'].totalFees,
      };

      delete hosts['stripe'];
      delete hosts['opencollective'];

      const profileUrl = `https://opencollective.com/${collective.slug}`;
      const tweetText = buildTweet(collective, collectivesBySlug, totalDonations);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${profileUrl}`;
      return {
        stats: {
          totalCollectives,
          totalDonations,
          totalDonationsString: formatCurrencyObject(totalDonations),
        },
        tweet: { text: tweetText.substr(2), url: tweetUrl },
        fburl: `https://facebook.com/sharer.php?url=${encodeURIComponent(
          `https://opencollective.com/${collective.slug}?description=${encodeURIComponent(tweetText.substr(2))}`,
        )}`,
        fees,
        hosts,
        year,
      };
    })
    .then(data => {
      return getUsers(collective).then(users => {
        data.collective = collective;
        data.platformStats = platformStats;
        data.recipients = users.map(u => u.email);
        if (data.recipients.length > 1) {
          console.log('>>> recipients for ', collective.type.toLowerCase(), collective.slug, ':', data.recipients);
        }
        if (data.recipients.length > 0) {
          return emailLib.send('user.yearlyreport', data.recipients, data);
        }
      });
    })
    .catch(console.error);
};

const getHosts = () => {
  return models.Member.findAll({
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('MemberCollectiveId')), 'MemberCollectiveId']],
    where: { role: 'HOST' },
  }).map(m => m.MemberCollectiveId);
};

const getCollectives = () => {
  const where = {};
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/)) {
    where.slug = {
      [Op.in]: ['xdamman', 'digitalocean', 'fbopensource', 'piamancini', 'brusselstogether', 'wwcode'],
    };
  }

  if (process.env.SLUGS) {
    const slugs = process.env.SLUGS.split(',');
    where.slug = { [Op.in]: slugs };
  }

  return models.Collective.findAll({
    where: { ...where, type: { [Op.in]: ['ORGANIZATION', 'USER'] } },
  });
};

const getUsers = collective => {
  return models.Notification.findAll({
    where: {
      channel: 'email',
      CollectiveId: collective.id,
      type: 'user.yearlyreport',
      active: false,
    },
  }).then(unsubscriptions => {
    const excludeUnsubscribed = {};
    const unsubscribedUserIds = unsubscriptions.map(u => u.UserId);
    if (unsubscribedUserIds.length > 0) {
      console.log(
        `${unsubscribedUserIds.length} users have unsubscribed from the user.yearlyreport report for collective ${collective.slug}`,
      );
    }

    if (unsubscribedUserIds.length > 0) {
      excludeUnsubscribed.id = { [Op.notIn]: unsubscribedUserIds };
    }
    if (collective.type === 'USER') {
      return models.User.findAll({
        where: { CollectiveId: collective.id, ...excludeUnsubscribed },
        include: [
          {
            model: models.Collective,
            as: 'collective',
            attributes: ['slug', 'name'],
          },
        ],
      });
    } else if (collective.type === 'ORGANIZATION') {
      return models.Member.findAll({
        where: { CollectiveId: collective.id, role: 'ADMIN' },
      }).then(memberships =>
        models.User.findAll({
          where: {
            CollectiveId: {
              [Op.in]: memberships.map(m => m.MemberCollectiveId),
            },
            ...excludeUnsubscribed,
          },
          include: [
            {
              model: models.Collective,
              as: 'collective',
              attributes: ['slug', 'name'],
            },
          ],
        }),
      );
    }
  });
};

const init = () => {
  const startTime = new Date();
  let hosts;
  getPlatformStats()
    .then(stats => (platformStats = stats))
    .then(() => getHosts())
    .then(h => (hosts = h))
    .then(() => getCollectives())
    .map(collective => {
      if (hosts.indexOf(collective.id) !== -1) {
        totalUsersSkipped++;
        return console.log(collective.slug, 'is a host, skipping');
      }
      return processCollective(collective);
    })
    .then(() => {
      const timeLapsed = Math.round((new Date() - startTime) / 1000);
      console.log('Total user/organizations processed: ', totalUsersProcessed);
      console.log('Total user/organizations skipped: ', totalUsersSkipped);
      console.log(`Total run time: ${timeLapsed}s`);
      process.exit(0);
    });
};

init();
