#!/usr/bin/env node

process.env.PORT = 3066;

import models, {sequelize} from '../../server/models';
import _ from 'lodash';
import moment from 'moment';
import config from 'config';
import Promise from 'bluebird';
import debugLib from 'debug';
import { isBackerActive, getTier } from '../../server/lib/utils';
import emailLib from '../../server/lib/email';

const d = new Date;
const startDate = new Date(`${d.getFullYear()}`);
const endDate = new Date(`${d.getFullYear()+1}`);

console.log("startDate", startDate, "endDate", endDate);

const debug = debugLib('yearlyreport');

const GetUserTransactionsQuery = `
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
  host.avatar as "hostLogo", host."twitterHandle" as "hostTwitterHandle", host.description as "hostDescription", host.mission as "hostMission",
  g.slug, g.name, g.mission, g.logo, g."backgroundImage", g."twitterHandle", g.settings, g.data 
FROM "UserTransactions" ut 
LEFT JOIN "Groups" g ON ut."GroupId" = g.id
LEFT JOIN "UserGroups" ug ON ut."GroupId" = ug."GroupId" AND ug.role='HOST'
LEFT JOIN "Users" host ON ug."UserId" = host.id`;

const processUser = (user) => {
  return sequelize.query(GetUserTransactionsQuery, {
    type: sequelize.QueryTypes.SELECT,
    replacements: { userid: user.id }
  })
  .then(rows => {
    const hosts = { opencollective: { name: 'Platform fees'}, stripe: { name: 'Credit Card Processing Fees (Stripe)' } };
    const totalCollectives = rows.length;
    const totalDonations = {};
    rows.forEach(row => {
      if (typeof hosts[row.hostSlug] === 'undefined') {
        hosts[row.hostSlug] = {
          slug: row.hostSlug,
          name: row.hostName.trim() || row.hostSlug,
          logo: row.hostLogo,
          twitterHandle: row.hostTwitterHandle,
          description: row.hostDescription || row.hostMission,
          collectives: {}
        };
      }
      hosts[row.hostSlug].collectives[row.slug] = {
        slug: row.slug,
        name: row.name || row.slug,
        mission: row.mission,
        logo: row.logo,
        backgroundImage: row.backgroundImage,
        twitterHandle: row.twitterHandle,
        settings: row.settings,
        data: row.data,
        totalDonations: Number(row.amountInTxnCurrency),
        currency: row.txnCurrency
      };

      hosts[row.hostSlug].collectives[row.slug].tier = getTier({ totalDonations: Number(row.amountInTxnCurrency)}, row.tiers);

      _.set(totalDonations, row.txnCurrency, 0);
      _.set(hosts, [row.hostSlug, 'totalFees', row.txnCurrency], 0);
      _.set(hosts, ['stripe', 'totalFees', row.txnCurrency], 0);
      _.set(hosts, ['opencollective', 'totalFees', row.txnCurrency], 0);

      totalDonations[row.txnCurrency] += Number(row.amountInTxnCurrency);
      hosts[row.hostSlug]['totalFees'][row.txnCurrency] += Number(row.hostFeeInTxnCurrency);
      hosts['opencollective']['totalFees'][row.txnCurrency] += Number(row.platformFeeInTxnCurrency);
      hosts['stripe']['totalFees'][row.txnCurrency] += Number(row.paymentProcessorFeeInTxnCurrency);
    })

    const fees = {
      stripe: hosts['stripe'].totalFees,
      opencollective: hosts['opencollective'].totalFees,
    };

    delete hosts['stripe'];
    delete hosts['opencollective'];

    return {
      stats: { totalCollectives, totalDonations },
      fees,
      hosts
    }
  })
  .then(data => {
    data.recipient = user;
    console.log("data hosts['adminwwc']", data.hosts['adminwwc']);
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
