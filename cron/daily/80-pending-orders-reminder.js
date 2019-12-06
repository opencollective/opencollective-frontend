#!/usr/bin/env node
import '../../server/env';

import logger from '../../server/lib/logger';
import models, { Op } from '../../server/models';
import status from '../../server/constants/order_status';
import * as libPayments from '../../server/lib/payments';

const REMINDER_DAYS = 4;

const fetchPendingOrders = async date => {
  const dateFrom = new Date(date).setUTCHours(0, 0, 0, 0);
  const dateTo = new Date(dateFrom).setUTCHours(23, 59, 59);

  const orders = await models.Order.findAll({
    where: {
      status: status.PENDING,
      deletedAt: null,
      PaymentMethodId: null,
      createdAt: { [Op.gte]: dateFrom, [Op.lte]: dateTo },
    },
    include: [
      { model: models.Collective, as: 'fromCollective' },
      { model: models.User, as: 'createdByUser' },
      { model: models.Collective, as: 'collective' },
    ],
  });

  return orders;
};

const run = async () => {
  const reminderDate = process.env.START_DATE ? new Date(process.env.START_DATE) : new Date();
  reminderDate.setDate(reminderDate.getDate() - REMINDER_DAYS);

  const orders = await fetchPendingOrders(reminderDate);
  for (const order of orders) {
    await libPayments.sendReminderPendingOrderEmail(order);
  }

  logger.info('Done.');
  process.exit();
};

run();
