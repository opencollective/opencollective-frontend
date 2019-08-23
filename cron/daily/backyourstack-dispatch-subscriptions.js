#!/usr/bin/env node
import '../../server/env';

import { filter } from 'bluebird';
import { Op } from 'sequelize';

import models from '../../server/models';
import status from '../../server/constants/order_status';
import { dispatchFunds, getNextDispatchingDate, needsDispatching } from '../../server/lib/backyourstack/dispatcher';

async function run() {
  const tiers = await models.Tier.findAll({
    where: {
      slug: { [Op.iLike]: 'monthly-plan' },
      deletedAt: null,
    },
    include: [
      {
        model: models.Collective,
        where: { slug: 'backyourstack' },
      },
    ],
  });

  if (tiers.length === 0) {
    console.log('Could not find any matching tiers.');
    process.exit(1);
  }

  const tierIds = tiers.map(tier => tier.id);

  const allOrders = await models.Order.findAll({
    where: {
      status: status.ACTIVE,
      SubscriptionId: { [Op.ne]: null },
      deletedAt: null,
    },
    include: [
      {
        model: models.Tier,
        where: { id: { [Op.in]: tierIds } },
      },
      { model: models.Collective, as: 'fromCollective' },
      { model: models.User, as: 'createdByUser' },
      { model: models.Collective, as: 'collective' },
      {
        model: models.Subscription,
        where: {
          isActive: true,
          deletedAt: null,
          deactivatedAt: null,
        },
      },
    ],
  });

  return filter(allOrders, order => {
    return order.Subscription.data && needsDispatching(order.Subscription.data.nextDispatchDate);
  }).map(
    async order => {
      return dispatchFunds(order)
        .then(async () => {
          const nextDispatchDate = getNextDispatchingDate(
            order.Subscription.interval,
            order.Subscription.data.nextDispatchDate,
          );
          order.Subscription.data = { nextDispatchDate };
          await order.Subscription.save();
          await order.save();
        })
        .catch(error => {
          console.log(`Error occured processing and dispatching order ${order.id}`);
          console.error(error);
        });
    },
    { concurrency: 3 },
  );
}

run()
  .then(() => {
    console.log('>>> All subscription dispatched');
    process.exit(0);
  })
  .catch(error => {
    console.log('Error when dispatching fund');
    console.error(error);
    process.exit(1);
  });
