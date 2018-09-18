'use strict';

const DRY_RUN = false;

const Promise = require('bluebird');

const ordersProcessed = [];
const cache = { getUserCollectiveId: {} };

const updateOrders = sequelize => {
  const getUserCollectiveId = UserId => {
    if (cache.getUserCollectiveId[UserId])
      return Promise.resolve(cache.getUserCollectiveId[UserId]);

    return sequelize
      .query(`SELECT "CollectiveId" FROM "Users" WHERE id=:UserId`, {
        type: sequelize.QueryTypes.SELECT,
        replacements: { UserId },
      })
      .then(res => {
        const CollectiveId = res[0] && res[0].CollectiveId;
        if (!CollectiveId) {
          throw new Error('No CollectiveId found for UserId', UserId);
        }
        cache.getUserCollectiveId[UserId] = CollectiveId;
        return CollectiveId;
      });
  };

  const updateOrder = order => {
    ordersProcessed.push(order.id);
    return getUserCollectiveId(order.CreatedByUserId)
      .then(CollectiveId => {
        if (DRY_RUN) {
          return console.log(
            '>>> UPDATE Orders SET FromCollectiveId to ',
            CollectiveId,
            'WHERE id=',
            order.id,
          );
        }
        return sequelize.query(
          `UPDATE "Orders" SET "FromCollectiveId"=:CollectiveId WHERE id=:id`,
          {
            replacements: { id: order.id, CollectiveId },
          },
        );
      })
      .then(() => {
        return sequelize.query(
          `SELECT COUNT(*) FROM "Transactions" WHERE "OrderId"=:id`,
          {
            replacements: { id: order.id },
          },
        );
      })
      .then(res => {
        if (!res) return;
        const count = res[0][0].count;
        if (count % 2 !== 0) {
          console.log('OrderId:', order.id, 'Number of transactions: ', count);
          if (order.PaymentMethodId) {
            throw new Error(
              `OrderId ${
                order.id
              } has an uneven number of transactions: ${count}`,
            );
          }
        }
      });
  };
  const limit = DRY_RUN ? 'LIMIT 150' : '';
  return sequelize
    .query(
      `SELECT id, "CreatedByUserId", "PaymentMethodId" FROM "Orders" WHERE "FromCollectiveId" is NULL ${limit}`,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(rows => rows && Promise.map(rows, updateOrder, { concurrency: 10 }));
};

const down = (queryInterface, DataTypes) => {
  console.log('>>> Restoring ', ordersProcessed.length, 'orders');
  return queryInterface.sequelize.query(
    `UPDATE "Orders" SET "FromCollectiveId"=null WHERE id IN (:ordersProcessed)`,
    {
      replacements: { ordersProcessed },
    },
  );
};

module.exports = {
  up: function(queryInterface, DataTypes) {
    // temporary column for binding transactions together, eventually they should all have the same OrderId if they are part of a same Order
    return updateOrders(queryInterface.sequelize).then(() => {
      console.log('>>> ', ordersProcessed.length, 'orders processed');
      if (DRY_RUN) {
        throw new Error('Throwing to make sure we can retry this migration');
      }
    });
  },
  down,
};
