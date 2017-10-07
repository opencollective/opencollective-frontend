'use strict';

const DRY_RUN = false;

const Promise = require('bluebird');

const ordersProcessed = [];
const cache = { getUserCollectiveId: {} };

const updateOrders = (sequelize) => {

  const getUserCollectiveId = (UserId) => {
    if (cache.getUserCollectiveId[UserId]) return Promise.resolve(cache.getUserCollectiveId[UserId]);

    return sequelize.query(`SELECT "CollectiveId" FROM "Users" WHERE id=:UserId`, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { UserId }}
    )
  .then(res => {
    const CollectiveId = res[0] && res[0].CollectiveId;
    if (!CollectiveId) {
      throw new Error("No CollectiveId found for UserId", UserId);
    }
    cache.getUserCollectiveId[UserId] = CollectiveId;
    return CollectiveId;
  });
}

  const updateOrder = (order) => {

    ordersProcessed.push(order.id);
    return getUserCollectiveId(order.CreatedByUserId)
      .then(CollectiveId => {
        if (DRY_RUN) {
          return console.log(">>> UPDATE Orders SET FromCollectiveId to ", CollectiveId, "WHERE id=", order.id);
        }
        return sequelize.query(`UPDATE "Orders" SET "FromCollectiveId"=:CollectiveId WHERE id=:id`, {
          replacements: { id: order.id, CollectiveId }
        });
      })
  };

  return sequelize.query(`SELECT id, "CreatedByUserId" FROM "Orders" WHERE "FromCollectiveId" is NULL`, { type: sequelize.QueryTypes.SELECT })
  .then(rows => rows && Promise.map(rows, updateOrder, { concurrency: 10 }))
}

const down = (queryInterface, DataTypes) => {
  console.log(">>> Restoring ", ordersProcessed.length, "orders");
  return queryInterface.sequelize.query(`UPDATE "Orders" SET "FromCollectiveId"=null WHERE id IN (:ordersProcessed)`, {
    replacements: { ordersProcessed }
  })
}

module.exports = {
  up: function (queryInterface, DataTypes) {
    // temporary column for binding transactions together, eventually they should all have the same OrderId if they are part of a same Order
    return updateOrders(queryInterface.sequelize)
      .then(() => {
        console.log(">>> ", ordersProcessed.length, "orders processed");
      });
  },
  down
};
