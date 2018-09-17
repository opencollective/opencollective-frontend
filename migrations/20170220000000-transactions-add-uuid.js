'use strict';
var Promise = require('bluebird');
var uuid = require('uuid');

const updateTransactions = sequelize => {
  const updateTransaction = transaction => {
    return sequelize.query(
      `UPDATE "Transactions" SET uuid=:uuid WHERE id=:id`,
      {
        replacements: { id: transaction.id, uuid: uuid.v4() },
      },
    );
  };

  return sequelize
    .query(`SELECT * FROM "Transactions" WHERE uuid IS NULL`, {
      type: sequelize.QueryTypes.SELECT,
    })
    .then(transactions => Promise.map(transactions, updateTransaction));
};

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Transactions', 'uuid', { type: Sequelize.STRING(36) })
      .then(() =>
        queryInterface.addIndex('Transactions', ['uuid'], {
          indicesType: 'UNIQUE',
        }),
      )
      .then(() => updateTransactions(queryInterface.sequelize));
  },

  down: function(queryInterface) {
    return queryInterface
      .removeIndex('Transactions', ['uuid'])
      .then(() => queryInterface.removeColumn('Transactions', 'uuid'));
  },
};
