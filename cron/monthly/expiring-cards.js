#!/usr/bin/env node
import '../../server/env';

import logger from '../../server/lib/logger';
import models from '../../server/models';
import * as libPayments from '../../server/lib/payments';

// Only run on the first of the month
const today = new Date();
const date = today.getDate();
const month = today.getMonth() + 1;
const year = today.getFullYear();

if (process.env.NODE_ENV === 'production' && date !== 1 && !process.env.OFFCYCLE) {
  console.log('NODE_ENV is production and today is not the first of month, script aborted!');
  process.exit();
}

// link payment method id in Orders to payment method id in the payment method we're updating

const fetchExpiringCreditCards = async (month, year) => {
  const expiringCards = await models.PaymentMethod.findAll({
    where: {
      type: 'creditcard',
      data: {
        expMonth: month,
        expYear: year,
      },
    },
    include: [
      {
        model: models.Order,
        where: { status: 'ACTIVE' },
      },
    ],
  });

  return expiringCards;
};

const run = async () => {
  const cards = await fetchExpiringCreditCards(month, year);

  for (const card of cards) {
    try {
      const { id, CollectiveId, name } = card;
      const brand = card.data.brand || 'credit card';

      const collective = await models.Collective.findByPk(CollectiveId);
      const adminUsers = await collective.getAdminUsers();

      for (const adminUser of adminUsers) {
        const { slug } = collective;
        const collectiveName = collective.name;
        const { email } = adminUser;
        const userId = adminUser.id;

        const data = {
          id,
          brand,
          name,
          userId,
          CollectiveId,
          collectiveName,
          slug,
          email,
        };

        logger.info(
          `Payment method ${data.id} for collective '${data.slug}' is expiring, sending an email to ${data.email}`,
        );
        if (!process.env.DRY_RUN) {
          await libPayments.sendExpiringCreditCardUpdateEmail(data);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  logger.info('Done sending credit card update emails.');
  process.exit();
};

if (require.main === module) {
  run();
}
