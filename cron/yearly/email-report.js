#!/usr/bin/env node

process.env.PORT = 3066;

import models, {sequelize} from '../../server/models';
import _ from 'lodash';
import moment from 'moment';
import config from 'config';
import Promise from 'bluebird';
import debugLib from 'debug';
import { isBackerActive } from '../../server/lib/utils';
import emailLib from '../../server/lib/email';

const d = new Date;
const startDate = new Date(`${d.getFullYear()}`);
const endDate = new Date(`${d.getFullYear()+1}`);

console.log("startDate", startDate, "endDate", endDate);

const debug = debugLib('yearlyreport');

const query = `
with "UserTransactions" as (
  SELECT
    "GroupId",
    SUM("amountInTxnCurrency") as "amountInTxnCurrency",
    MAX("txnCurrency") as "txnCurrency",
    SUM("platformFeeInTxnCurrency") as "platformFeeInTxnCurrency",
    MAX("hostFeeInTxnCurrency") as "hostFeeInTxnCurrency",
    MAX("paymentProcessorFeeInTxnCurrency") as "paymentProcessorFeeInTxnCurrency"
  FROM "Transactions"
  WHERE "UserId"=:userid AND amount > 0 AND "deletedAt" IS NULL AND "PaymentMethodId" IS NOT NULL
  GROUP BY "GroupId"
)
SELECT
  ut.*,
  host.username as "hostSlug",
  CONCAT(host."firstName", ' ', host."lastName") as "hostName",
  host.avatar as "hostLogo", host."twitterHandle" as "hostTwitterHandle", host.description as "hostDescription",
  g.slug, g.name, g.mission, g.logo, g."backgroundImage", g."twitterHandle", g.settings, g.data 
FROM "UserTransactions" ut 
LEFT JOIN "Groups" g ON ut."GroupId" = g.id
LEFT JOIN "UserGroups" ug ON ut."GroupId" = ug."GroupId" AND ug.role='HOST'
LEFT JOIN "Users" host ON ug."UserId" = host.id`;

const formatArrayToString = (arr) => {
  return arr.join(', ').replace(/, ([^, ]*)$/,' and $1');
}

const formatCurrency = (amount, currency, precision) => {
  amount = amount/100; // converting cents

  return amount.toLocaleString(currency, {
    style: 'currency',
    currency,
    minimumFractionDigits : precision || 0,
    maximumFractionDigits : precision || 0
  });  
}

const processUser = (user) => {
  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: { userid: user.id }
  })
  .then(rows => {
    const hosts = { opencollective: {}, stripe: {} };
    const totalCollectives = rows.length;
    const totalDonations = {};
    rows.forEach(row => {
      if (typeof hosts[row.hostSlug] === 'undefined') {
        hosts[row.hostSlug] = {
          slug: row.hostSlug,
          name: row.hostName,
          logo: row.hostLogo,
          twitterHandle: row.hostTwitterHandle,
          description: row.hostDescription,
          collectives: {}
        };
      }
      hosts[row.hostSlug].collectives[row.slug] = {
        slug: row.slug,
        name: row.name,
        mission: row.mission,
        logo: row.logo,
        backgroundImage: row.backgroundImage,
        twitterHandle: row.twitterHandle,
        settings: row.settings,
        data: row.data,
        totalDonations: row.amountInTxnCurrency,
        currency: row.txnCurrency
      };

      _.set(totalDonations, row.txnCurrency, 0);
      _.set(hosts, [row.hostSlug, 'totalDonations', row.txnCurrency], 0);
      _.set(hosts, ['stripe', 'totalDonations', row.txnCurrency], 0);
      _.set(hosts, ['opencollective', 'totalDonations', row.txnCurrency], 0);

      totalDonations[row.txnCurrency] += Number(row.amountInTxnCurrency);
      hosts[row.hostSlug]['totalDonations'][row.txnCurrency] += Number(row.hostFeeInTxnCurrency);
      hosts['opencollective']['totalDonations'][row.txnCurrency] += Number(row.platformFeeInTxnCurrency);
      hosts['stripe']['totalDonations'][row.txnCurrency] += Number(row.paymentProcessorFeeInTxnCurrency);
    })

    const totalDonationsArray = [];
    for (const currency in totalDonations) {
      totalDonationsArray.push(formatCurrency(totalDonations[currency], currency));
    }
    const totalDonationsString = formatArrayToString(totalDonationsArray);

    return {
      stats: { totalCollectives, totalDonations, totalDonationsString },
      hosts
    }
  })
  .then(data => {
    data.recipient = user;
    return emailLib.send('group.yearlyreport', user.email, data);
  })
};

const processUsers = (users) => {
  return Promise.map(users, processUser);
};

const init = () => {

  const startTime = new Date;

  models.User.findAll({
    where: {
      username: 'xdamman'
    }
  })
  .then(processUsers)
  .then(() => {
    const timeLapsed = Math.round((new Date - startTime)/1000);
    console.log(`Total run time: ${timeLapsed}s`);
    process.exit(0);
  });
}

init();
