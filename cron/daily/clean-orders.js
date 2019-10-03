#!/usr/bin/env node
import '../../server/env';

import { sequelize } from '../../server/models';

// we have to use raw sql query today
// https://github.com/sequelize/sequelize/issues/3957

// Mark all Manual Payments as ERROR after 2 months
// Make sure to not include pledges
sequelize.query(
  `UPDATE "Orders"
  SET "status" = 'ERROR', "updatedAt" = NOW()
  FROM "Collectives"
  WHERE "Orders"."status" = 'PENDING'
  AND "Orders"."PaymentMethodId" IS NULL
  AND "Collectives"."id" = "Orders"."CollectiveId"
  AND "Collectives"."isPledged" = FALSE
  AND "Collectives"."HostCollectiveId" IS NOT NULL
  AND "Orders"."createdAt" <  (NOW() - interval '2 month')`,
);

// Mark all PENDING errors that are not Manual Payments or Pledge as ERROR after 1 day
sequelize.query(
  `UPDATE "Orders"
  SET "status" = 'ERROR', "updatedAt" = NOW()
  FROM "Collectives"
  WHERE "Orders"."status" = 'PENDING'
  AND "Orders"."PaymentMethodId" IS NOT NULL
  AND "Collectives"."id" = "Orders"."CollectiveId"
  AND "Collectives"."isPledged" = FALSE
  AND "Collectives"."HostCollectiveId" IS NOT NULL
  AND "Orders"."createdAt" <  (NOW() - interval '1 day')`,
);
