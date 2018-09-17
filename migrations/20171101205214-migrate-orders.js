'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

const ordersUpdated = [];

const updateOrders = sequelize => {
  // find each order, check that "FromCollectiveId" matches that in transaction table
  // if not, update Order

  return sequelize
    .query(
      `
    SELECT * from "Orders"
    WHERE "deletedAt" is null AND "processedAt" is not null AND "CollectiveId" != 1
    ORDER BY id
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    )
    .then(orders => {
      console.log('>>> orders found: ', orders.length);
      return orders;
    })
    .each(order => {
      return sequelize
        .query(
          `
        SELECT distinct("FromCollectiveId") from "Transactions"
        WHERE "OrderId" = :orderId AND type LIKE 'CREDIT' AND "deletedAt" is null
        `,
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
              orderId: order.id,
            },
          },
        )
        .then(FromCollectiveIds => {
          if (FromCollectiveIds.length === 0) {
            return Promise.resolve();
          } else if (FromCollectiveIds.length > 1) {
            console.log('>>> order.id: ', order.id);
            throw new Error('Found different FromCollectiveIds for Order Id');
          } else if (
            FromCollectiveIds.length === 1 &&
            order.FromCollectiveId !== FromCollectiveIds[0].FromCollectiveId
          ) {
            return sequelize
              .query(
                `
              UPDATE "Orders"
                SET "FromCollectiveId" = :FromCollectiveId
              WHERE id = :orderId
              `,
                {
                  replacements: {
                    FromCollectiveId: FromCollectiveIds[0].FromCollectiveId,
                    orderId: order.id,
                  },
                },
              )
              .then(() => {
                ordersUpdated.push(order.id);
              });
          } else {
            return Promise.resolve();
          }
        });
    });
};

module.exports = {
  up: (queryInterface, DataTypes) => {
    // now process each org and make sure Members table is correct
    return updateOrders(queryInterface.sequelize).then(() => {
      console.log('>>> ', ordersUpdated.length, 'ordersUpdated');
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
