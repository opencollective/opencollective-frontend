'use strict';

import models from '../server/models';
import roles from '../server/constants/roles';

module.exports = {
  up: async (queryInterface, sequelize) => {
    // Get all orders with no associated memberships, based on tier id.
    // To this date (2019-12-16), this query in production returns 690 rows
    const ordersWithMissingMemberships = await queryInterface.sequelize.query(
      `
      WITH confirmed_orders AS (
        SELECT o.*
        FROM "Orders" o
        INNER JOIN "Transactions" t ON t."OrderId" = o.id
        WHERE status IN ('PAID', 'ACTIVE')
        AND "totalAmount" > 0
      ) SELECT 
        o."FromCollectiveId", 
        o."CollectiveId", 
        o."TierId",
        MAX(o."CreatedByUserId") AS "CreatedByUserId",
        MIN(o."createdAt") AS "createdAt"
      FROM 
        confirmed_orders o
      INNER JOIN 
        "PaymentMethods" pm ON pm.id = o."PaymentMethodId"
      LEFT JOIN
        "Members" m 
      ON 
        o."FromCollectiveId" = m."MemberCollectiveId" 
        AND o."CollectiveId" = m."CollectiveId" 
        AND (o."TierId" = m."TierId" OR (o."TierId" IS NULL AND m."TierId" IS NULL))
      WHERE 
        m.id IS NULL AND o."CreatedByUserId" IS NOT NULL
      GROUP BY
        o."FromCollectiveId", o."CollectiveId", o."TierId"
    `,
      {
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      },
    );

    const now = new Date();
    await models.Member.bulkCreate(
      ordersWithMissingMemberships.map(orderData => ({
        CreatedByUserId: orderData.CreatedByUserId,
        MemberCollectiveId: orderData.FromCollectiveId,
        CollectiveId: orderData.CollectiveId,
        TierId: orderData.TierId,
        since: orderData.createdAt,
        createdAt: now,
        updatedAt: now,
        role: roles.BACKER,
      })),
      { returning: false },
    );
  },

  down: async () => {
    // Can't undo this without loosing data
  },
};
