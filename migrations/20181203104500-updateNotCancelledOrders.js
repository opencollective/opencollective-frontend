'use strict';

const Promise = require('bluebird');

module.exports = {
  up: (queryInterface, sequelize) => {
    //set Status cancelled on all orders that are active but have subscription inactive
    return queryInterface.sequelize.query(`
      UPDATE "Orders" set status='CANCELLED' where id in (
      SELECT o.id FROM "Orders" o
      LEFT JOIN "Subscriptions" s ON o."SubscriptionId"=s.id
      WHERE (o.status='ACTIVE' or o.status='PENDING') AND s."isActive"=false);
    `);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve(); // No way to revert this
  },
};
