'use strict';

const Promise = require('bluebird');

module.exports = {
  up: (queryInterface, sequelize) => {
    // find all orders where totalAmount is 0 and status is PENDING
    // and update description, status, processedAt
    return queryInterface.sequelize
      .query(
        `
      SELECT o.id, o."createdAt", o.description FROM "Orders" o
      LEFT JOIN "Collectives" c ON o."CollectiveId" = c.id

      WHERE o."totalAmount" = 0 AND o.status = 'PENDING'
      `,
        { type: sequelize.QueryTypes.SELECT },
      )
      .then(orders => {
        console.log('Orders found: ', orders.length);

        return Promise.map(orders, o => {
          return queryInterface.sequelize.query(
            `
            UPDATE "Orders" 
              SET "processedAt" = :processedAt, "status" = 'PAID', description = :description
            WHERE "id" = :id
            `,
            {
              replacements: {
                id: o.id,
                processedAt: o.createdAt,
                description: o.description.replace(/^Donation/, 'Registration'),
              },
            },
          );
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve(); // No way to revert this
  },
};
