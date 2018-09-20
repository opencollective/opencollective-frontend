'use strict';

/**
 * Adds Transaction.HostId
 * Adds User.isHost
 * Adds User.currency
 *
 * And populates them
 */
const Promise = require('bluebird');
const fetch = require('isomorphic-fetch');

const missingCurrency = [];
const updateQueriesToPerform = []; // we keep track of all queries to perform to make sure we can run them in one transaction
const cache = {
  fxrate: {},
  HostIdForGroupId: {},
  updatedHosts: {},
  hostCurrency: {},
};

cache.hostCurrency = {
  51: 'EUR',
  3530: 'MXN',
  56: 'SEK',
  128: 'GBP',
  136: 'ARS',
  436: 'EUR',
  433: 'GBP',
};

cache.hostCurrency[244] = 'USD'; // docker
cache.hostCurrency[9] = 'USD'; // HacksHackers
cache.hostCurrency[458] = 'UYU'; // Partido Digital (Uruguay)
cache.hostCurrency[1231] = 'USD'; // Open Media Foundation
cache.hostCurrency[3164] = 'USD'; // MiSwift
cache.hostCurrency[4579] = 'USD'; // verdigrismusic.org
cache.hostCurrency[4647] = 'USD'; // relatedworks.org
cache.hostCurrency[5161] = 'USD'; // affcny.org
cache.hostCurrency[3271] = 'EUR'; // https://twitter.com/felixsanzm
cache.hostCurrency[2909] = 'USD'; // https://twitter.com/inhabit_

// some cache value to avoid rate limiting
cache.fxrate = {
  '2016-10-24-EUR-USD': 1.0891,
  '2016-10-19-EUR-USD': 1.0979,
  '2016-10-18-EUR-USD': 1.0993,
  '2016-12-23-EUR-USD': 1.0446,
  '2016-10-07-GBP-USD': 1.2329,
  '2016-12-07-GBP-USD': 1.2609,
  '2016-12-27-EUR-USD': 1.0445,
  '2016-12-23-GBP-USD': 1.2249,
  '2016-12-07-EUR-USD': 1.073,
  '2016-12-28-CAD-USD': 0.73667,
  '2016-12-27-GBP-USD': 1.2245,
  '2016-12-23-AUD-USD': 0.71715,
  '2016-03-22-AUD-USD': 0.76008,
  '2016-03-31-AUD-USD': 0.76889,
  '2016-04-02-MXN-USD': 0.057447,
  '2016-06-02-CHF-USD': 1.0114,
  '2017-03-07-MXN-USD': 0.05131,
  '2016-12-27-AUD-USD': 0.71876,
  '2016-12-27-INR-USD': 0.014702,
  '2017-06-02-EUR-USD': 1.1217,
  '2017-06-09-EUR-USD': 1.1176,
  '2017-06-14-GBP-USD': 1.2736,
  '2016-12-27-MXN-USD': 0.048505,
  '2017-06-06-AUD-USD': 0.74854,
  '2017-06-07-AUD-USD': 0.75561,
  '2017-02-21-EUR-USD': 1.0537,
  '2017-04-17-GBP-USD': 1.2541,
  '2017-03-31-CAD-USD': 0.74946,
  '2017-05-16-EUR-USD': 1.1059,
  '2017-03-14-MXN-USD': 0.050995,
  '2017-03-31-GBP-USD': 1.2496,
  '2016-11-01-EUR-USD': 1.1025,
  '2017-04-17-MXN-USD': 0.053779,
  '2016-12-28-AUD-USD': 0.71771,
  '2017-03-27-GBP-USD': 1.2603,
  '2016-02-16-MXN-USD': 0.053055,
  '2016-02-04-AUD-USD': 0.72083,
  '2016-04-18-INR-USD': 0.01502,
  '2016-08-15-MXN-USD': 0.055136,
  '2016-07-10-JPY-USD': 0.0099577,
  '2016-07-22-JPY-USD': 0.009425,
  '2016-03-05-AUD-USD': 0.73827,
  '2016-11-29-GBP-USD': 1.2469,
  '2016-12-28-JPY-USD': 0.0084982,
  '2016-07-19-JPY-USD': 0.0094155,
  '2016-03-27-AUD-USD': 0.75071,
  '2016-06-13-CAD-USD': 0.78304,
  '2016-05-16-MXN-USD': 0.054923,
  '2016-07-31-JPY-USD': 0.0096778,
  '2016-07-28-JPY-USD': 0.0095488,
  '2016-07-30-JPY-USD': 0.0096778,
  '2016-09-29-EUR-USD': 1.1221,
  '2016-02-15-MXN-USD': 0.053008,
  '2016-03-15-MXN-USD': 0.055973,
  '2016-09-30-EUR-USD': 1.1161,
  '2016-11-14-EUR-USD': 1.0777,
  '2017-06-05-GBP-USD': 1.2911,
  '2017-06-06-EUR-USD': 1.1258,
  '2017-05-08-EUR-USD': 1.0938,
  '2017-04-18-GBP-USD': 1.266,
  '2016-02-10-MXN-USD': 0.053439,
  '2016-06-09-AUD-USD': 0.7438,
};

function getDate(date = 'latest') {
  if (date.getFullYear) {
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();
    date = [
      date.getFullYear(),
      (mm > 9 ? '' : '0') + mm,
      (dd > 9 ? '' : '0') + dd,
    ].join('-');
  }
  return date;
}

const getFxRate = (fromCurrency, toCurrency, date = 'latest') => {
  if (fromCurrency === toCurrency) return Promise.resolve(1);
  if (!fromCurrency || !toCurrency) return Promise.resolve(1);
  if (fromCurrency === 'UYU' || toCurrency === 'UYU')
    return Promise.resolve('n/a');

  date = getDate(date);

  const key = `${date}-${fromCurrency}-${toCurrency}`;
  if (cache.fxrate[key]) return Promise.resolve(cache.fxrate[key]);
  const url = `http://api.fixer.io/${date}?base=${fromCurrency}&symbols=${toCurrency}`;
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(res => res.json())
      .then(json => {
        try {
          const fxrate = parseFloat(json.rates[toCurrency]);
          if (date != 'latest') {
            cache.fxrate[key] = fxrate;
          }
          return resolve(fxrate);
        } catch (e) {
          const msg = `>>> lib/currency: can't fetch fxrate from ${fromCurrency} to ${toCurrency} for date ${date}`;
          console.error(msg, 'json:', json, 'error:', e);
          console.log('>>> cache for fxrate', JSON.stringify(cache.fxrate));
          return reject(new Error(msg));
        }
      })
      .catch(e => {
        console.error('Error while calling', url, e);
        throw e;
      });
  });
};

const getHostCurrency = (sequelize, hostid) => {
  if (cache.hostCurrency[hostid])
    return Promise.resolve(cache.hostCurrency[hostid]);
  const query = `SELECT "txnCurrency" FROM "Transactions" WHERE "GroupId" IN (SELECT "GroupId" FROM "UserGroups" WHERE "UserId"=${hostid} AND role='HOST') AND "txnCurrency" is NOT NULL AND "deletedAt" IS NULL AND "PaymentMethodId" IS NOT NULL AND "txnCurrency" IS NOT NULL LIMIT 1`;
  return sequelize
    .query(query, { type: sequelize.QueryTypes.SELECT })
    .then(rows => {
      if (!rows[0] || !rows[0].txnCurrency) {
        const msg = `Cannot find a transaction currency for host ${hostid}, falling back to USD`;
        console.error(msg);
        missingCurrency.push(hostid);
        return 'USD';
      }
      const currency = rows[0].txnCurrency;
      cache.hostCurrency[hostid] = currency;
      return currency;
    });
};

const updateHosts = sequelize => {
  // updateHost is called for every group id that the host is hosting
  // but we only update the host once (but we may need to try multiple groups before we can find a transaction currency)
  // Set currency for each user that is acting as a host
  const updateHost = ug => {
    if (cache.updatedHosts[ug.UserId]) return Promise.resolve();
    return getHostCurrency(sequelize, ug.UserId)
      .then(currency => {
        console.log(
          `Updating user id ${ug.UserId}. Setting currency="${currency}"`,
        );
        updateQueriesToPerform.push(
          sequelize
            .query(`UPDATE "Users" SET currency=:currency WHERE id=:userid`, {
              replacements: { currency, userid: ug.UserId },
            })
            .then(() => {
              cache.updatedHosts[ug.UserId] = true;
            }),
        );
      })
      .catch(e => console.error(e.message));
  };

  return sequelize
    .query(`SELECT "UserId", "GroupId" FROM "UserGroups" WHERE role='HOST'`, {
      type: sequelize.QueryTypes.SELECT,
    })
    .then(ugs => Promise.map(ugs, updateHost));
};

const updateTransactions = sequelize => {
  const getHostId = groupid => {
    if (cache.HostIdForGroupId[groupid])
      return Promise.resolve(cache.HostIdForGroupId[groupid]);
    return sequelize
      .query(
        `
      SELECT "UserId" FROM "UserGroups" WHERE "GroupId"=:groupid AND role='HOST'
    `,
        { type: sequelize.QueryTypes.SELECT, replacements: { groupid } },
      )
      .then(ug => {
        const HostId = ug[0] && ug[0].UserId;
        if (!HostId) {
          throw new Error(`Not host found for group id ${groupid}`);
        }
        cache.HostIdForGroupId[groupid] = HostId;
        return HostId;
      });
  };

  // updateTransaction
  // Add HostId to the transaction.
  const updateTransaction = transaction => {
    let hostid;
    return getHostId(transaction.GroupId)
      .then(id => {
        hostid = id;
        if (!hostid)
          throw new Error(
            `Unable to update transaction ${
              transaction.id
            }: No hostid for group ${transaction.GroupId}`,
          );
        return getHostCurrency(sequelize, hostid);
      })
      .then(hostCurrency => {
        // If txnCurrency is NULL or different than the currency of the host,
        // we update txnCurrency, txnCurrencyFxRate, amountInTxnCurrency
        if (transaction.txnCurrency !== hostCurrency) {
          return getFxRate(
            transaction.currency,
            hostCurrency,
            transaction.createdAt,
          ).then(fxrate => {
            if (isNaN(fxrate)) {
              console.log(
                '> transaction',
                transaction.id,
                transaction.currency,
                hostCurrency,
                ' -- no fxrate found',
              );
              return updateQueriesToPerform.push(
                sequelize.query(
                  `UPDATE "Transactions" SET "HostId"=:hostid, "txnCurrency"=:hostCurrency WHERE id=:id`,
                  {
                    replacements: {
                      id: transaction.id,
                      hostid,
                      hostCurrency,
                    },
                  },
                ),
              );
            } else {
              const amountInTxnCurrency = Math.round(
                parseInt(transaction.amount, 10) * parseFloat(fxrate),
              ); // INTEGER in cents
              console.log(
                '> transaction',
                transaction.id,
                transaction.createdAt,
                transaction.currency,
                hostCurrency,
                'fxrate',
                fxrate,
                'amountInTxnCurrency',
                amountInTxnCurrency,
              );
              let data = transaction.data || {};
              if (fxrate !== 1) {
                data.fxrateSource = 'fixer.io';
              }
              return updateQueriesToPerform.push(
                sequelize.query(
                  `UPDATE "Transactions" SET "HostId"=:hostid, "txnCurrencyFxRate"=:fxrate, "txnCurrency"=:hostCurrency, "amountInTxnCurrency"=:amountInTxnCurrency, data=:data WHERE id=:id`,
                  {
                    replacements: {
                      id: transaction.id,
                      hostid,
                      fxrate,
                      hostCurrency,
                      amountInTxnCurrency,
                      data: JSON.stringify(data),
                    },
                  },
                ),
              );
            }
          });
        } else {
          // Just set the HostId
          console.log(
            `> transaction ${
              transaction.id
            } - Adding HostId ${hostid} to transaction`,
          );
          updateQueriesToPerform.push(
            sequelize.query(
              `UPDATE "Transactions" SET "HostId"=:hostid WHERE id=:id`,
              { replacements: { id: transaction.id, hostid } },
            ),
          );
        }
      });
  };

  return sequelize
    .query(
      `SELECT id, "createdAt", "GroupId", currency, "txnCurrency", amount, data FROM "Transactions"`,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(transactions => Promise.map(transactions, updateTransaction))
    .then(() => Promise.all(updateQueriesToPerform))
    .then(() =>
      console.log(
        '>>> missing currency for hosts (fallback to USD)',
        JSON.stringify(missingCurrency),
      ),
    );
};

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Transactions', 'HostId', {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
      .then(() =>
        queryInterface.addColumn('Users', 'currency', {
          type: Sequelize.STRING,
        }),
      )
      .then(() => updateHosts(queryInterface.sequelize))
      .then(() => updateTransactions(queryInterface.sequelize))
      .catch(e => {
        console.error('Error in migration. Reverting back.', e);
        return queryInterface
          .removeColumn('Transactions', 'HostId')
          .then(() => queryInterface.removeColumn('Users', 'currency'))
          .then(() => {
            throw e;
          });
      });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('Transactions', 'HostId')
      .then(() => queryInterface.removeColumn('Users', 'currency'));
  },
};
