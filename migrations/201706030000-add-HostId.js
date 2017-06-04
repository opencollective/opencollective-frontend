'use strict';

/**
 * Adds Transaction.HostId
 * Adds User.isHost
 * Adds User.currency
 * 
 * And populates them
 */
const Promise = require('bluebird');

const cache = { HostIdForGroupId: {}, updatedHosts: {} };

const updateHosts = (sequelize) => {

  const getHostCurrency = (ug) => {
    const query = `SELECT "txnCurrency" FROM "Transactions" WHERE "GroupId"=${ug.GroupId} AND "txnCurrency" is NOT NULL LIMIT 1`
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
      .then(rows => {
        if (!rows[0] || !rows[0].txnCurrency) {
          const msg = `Cannot find a transaction currency for host ${ug.UserId} using group id ${ug.GroupId}`;
          throw new Error(msg);
        }
        return rows[0].txnCurrency;
      });
  }

  // updateHost is called for every group id that the host is hosting
  // but we only update the host once (but we may need to try multiple groups before we can find a transaction currency)
  // Set isHost = true and currency for each user that is acting as a host
  const updateHost = (ug) => {
    if (cache.updatedHosts[ug.UserId]) return;
    return getHostCurrency(ug).then(currency => {
      console.log(`Updating user id ${ug.UserId}. Setting isHost=true and currency="${currency}"`);
      return sequelize.query(`UPDATE "Users" SET "isHost"=true, currency=:currency WHERE id=:userid`, { replacements: { currency, userid: ug.UserId }})
        .then(() => {
          cache.updatedHost[ug.UserId] = true;
        });
    })
    .catch(e => console.error(e.message)); // If the current GroupId couldn't 
  };

  return sequelize.query(`SELECT "UserId", "GroupId" FROM "UserGroups" WHERE role='HOST'`, { type: sequelize.QueryTypes.SELECT })
    .then(ugs => Promise.map(ugs, updateHost))
}

const updateTransactions = (sequelize) => {

  const getHostId = (groupid) => {
    if (cache.HostIdForGroupId[groupid]) return Promise.resolve(cache[groupid]);
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
    return getHostId(transaction.GroupId)
      .then(hostid => {
        // Update the transaction
        console.log(`Adding HostId ${hostid} to transaction ${transaction.id}`);
        return sequelize.query(`UPDATE "Transactions" SET "HostId"=:hostid WHERE id=:id`, { replacements: { id: transaction.id, hostid }})
      })
      .catch(console.error);
  };

  return sequelize.query(`SELECT id, "GroupId" FROM "Transactions"`, { type: sequelize.QueryTypes.SELECT }).then(transactions => Promise.map(transactions, updateTransaction));
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
      .then(() => queryInterface.addColumn('Users', 'isHost', { type: Sequelize.BOOLEAN, defaultValue: false }))
      .then(() => updateHosts(queryInterface.sequelize))
      .then(() => updateTransactions(queryInterface.sequelize))
      .catch(e => {
        console.error("Error in migration. Reverting back.", e);
        return queryInterface.removeColumn('Transactions', 'HostId')
          .then(() => queryInterface.removeColumn('Users', 'currency'))
          .then(() => queryInterface.removeColumn('Users', 'isHost'))
          .then(() => {
            throw e
          });
      })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Transactions', 'HostId')
      .then(() => queryInterface.removeColumn('Users', 'currency'))
      .then(() => queryInterface.removeColumn('Users', 'isHost'));
  }
};
