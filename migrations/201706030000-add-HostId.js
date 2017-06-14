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
const cache = { fxrate: {}, HostIdForGroupId: {}, updatedHosts: {}, hostCurrency: {} };

cache.hostCurrency = {
  51: 'EUR',
  3530: 'MXN',
  56: 'SEK',
  128: 'GBP',
  136: 'ARS',
  436: 'EUR',
  433: 'GBP'
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


function getDate(date = 'latest') {
  if (date.getFullYear) {
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();    
    date = [date.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
  }
  return date;
}

const getFxRate = (fromCurrency, toCurrency, date = 'latest') => {

  if (fromCurrency === toCurrency) return Promise.resolve(1);
  if (!fromCurrency || !toCurrency) return Promise.resolve(1);

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
          console.error(msg, "json:", json, "error:", e);
          return reject(new Error(msg));
        }
      })
      .catch(e => {
        console.error("Error while calling", url, e)
        throw e;
      })
  });
}

const getHostCurrency = (sequelize, hostid) => {
  if (cache.hostCurrency[hostid]) return Promise.resolve(cache.hostCurrency[hostid]);
  const query = `SELECT "txnCurrency" FROM "Transactions" WHERE "GroupId" IN (SELECT "GroupId" FROM "UserGroups" WHERE "UserId"=${hostid} AND role='HOST') AND "txnCurrency" is NOT NULL AND "deletedAt" IS NULL AND "PaymentMethodId" IS NOT NULL AND "txnCurrency" IS NOT NULL LIMIT 1`
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
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
}


const updateHosts = (sequelize) => {

  // updateHost is called for every group id that the host is hosting
  // but we only update the host once (but we may need to try multiple groups before we can find a transaction currency)
  // Set currency for each user that is acting as a host
  const updateHost = (ug) => {
    if (cache.updatedHosts[ug.UserId]) return Promise.resolve();
    return getHostCurrency(sequelize, ug.UserId).then(currency => {
      console.log(`Updating user id ${ug.UserId}. Setting currency="${currency}"`);
      updateQueriesToPerform.push(sequelize.query(`UPDATE "Users" SET currency=:currency WHERE id=:userid`, { replacements: { currency, userid: ug.UserId }})
        .then(() => {
          cache.updatedHosts[ug.UserId] = true;
        }));
    })
    .catch(e => console.error(e.message)); 
  };

  return sequelize.query(`SELECT "UserId", "GroupId" FROM "UserGroups" WHERE role='HOST'`, { type: sequelize.QueryTypes.SELECT })
    .then(ugs => Promise.map(ugs, updateHost))
}

const updateTransactions = (sequelize) => {

  const getHostId = (groupid) => {
    if (cache.HostIdForGroupId[groupid]) return Promise.resolve(cache.HostIdForGroupId[groupid]);
    return sequelize.query(`
      SELECT "UserId" FROM "UserGroups" WHERE "GroupId"=:groupid AND role='HOST'
    `, { type: sequelize.QueryTypes.SELECT, replacements: { groupid }})
    .then(ug => {
      const HostId = ug[0].UserId;
      if (!HostId) {
        throw new Error(`Not host found for group id ${groupid}`);
      }
      cache.HostIdForGroupId[groupid] = HostId;
      return HostId;
    });
  }

  // updateTransaction
  // Add HostId to the transaction.
  const updateTransaction = (transaction) => {
    let hostid;
    return getHostId(transaction.GroupId)
      .then(id => {
        hostid = id;
        if (!hostid) throw new Error(`Unable to update transaction ${transaction.id}: No hostid for group ${transaction.GroupId}`);
        return getHostCurrency(sequelize, hostid);
      })
      .then(hostCurrency => {
        // If txnCurrency is NULL or different than the currency of the host,
        // we update txnCurrency, txnCurrencyFxRate, amountInTxnCurrency
        if (transaction.txnCurrency !== hostCurrency) {
          return getFxRate(transaction.currency, hostCurrency, transaction.createdAt)
            .then(fxrate => {
              if (isNaN(fxrate)) {
                console.log("> transaction", transaction.id, transaction.currency, hostCurrency, " -- no fxrate found");
                return updateQueriesToPerform.push(sequelize.query(`UPDATE "Transactions" SET "HostId"=:hostid, "txnCurrency"=:hostCurrency WHERE id=:id`, { 
                  replacements: {
                    id: transaction.id,
                    hostid,
                    hostCurrency
                  }
                }));
              } else {
                const amountInTxnCurrency = Math.round(parseInt(transaction.amount, 10) * parseFloat(fxrate)) // INTEGER in cents
                console.log("> transaction", transaction.id, transaction.createdAt, transaction.currency, hostCurrency, "fxrate", fxrate,"amountInTxnCurrency", amountInTxnCurrency);
                return updateQueriesToPerform.push(sequelize.query(`UPDATE "Transactions" SET "HostId"=:hostid, "txnCurrencyFxRate"=:fxrate, "txnCurrency"=:hostCurrency, "amountInTxnCurrency"=:amountInTxnCurrency WHERE id=:id`, { 
                  replacements: {
                    id: transaction.id,
                    hostid,
                    fxrate,
                    hostCurrency,
                    amountInTxnCurrency
                  }
                }))
              }
            })
        } else {
          // Just set the HostId
          console.log(`> transaction ${transaction.id} - Adding HostId ${hostid} to transaction`);
          updateQueriesToPerform.push(sequelize.query(`UPDATE "Transactions" SET "HostId"=:hostid WHERE id=:id`, { replacements: { id: transaction.id, hostid }}))
        }
      })
  };

  return sequelize.query(`SELECT id, "createdAt", "GroupId", currency, "txnCurrency", amount FROM "Transactions" LIMIT 100`, { type: sequelize.QueryTypes.SELECT }).then(transactions => Promise.map(transactions, updateTransaction))
  .then(() => Promise.all(updateQueriesToPerform))
  .then(() => console.log(">>> missing currency for hosts", missingCurrency.join(', ')));
}

module.exports = {
  up: function (queryInterface, Sequelize) {

    return queryInterface.addColumn('Transactions', 'HostId', {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      })
      .then(() => queryInterface.addColumn('Users', 'currency', { type: Sequelize.STRING }))
      .then(() => updateHosts(queryInterface.sequelize))
      .then(() => updateTransactions(queryInterface.sequelize))
      .catch(e => {
        console.error("Error in migration. Reverting back.", e);
        return queryInterface.removeColumn('Transactions', 'HostId')
          .then(() => queryInterface.removeColumn('Users', 'currency'))
          .then(() => {
            throw e
          });
      })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Transactions', 'HostId')
      .then(() => queryInterface.removeColumn('Users', 'currency'))
  }
};
