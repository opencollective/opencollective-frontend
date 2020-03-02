#!/usr/bin/env node
import '../../server/env';

import logger from '../../server/lib/logger';
import models from '../../server/models';
import * as libPayments from '../../server/lib/payments';

// Run on the 7th and 21st of the month
const today = new Date();
const date = today.getDate();
const month = today.getMonth() + 1;
const year = today.getFullYear();

if (process.env.NODE_ENV === 'production' && date !== 7 && date !== 21 && !process.env.OFFCYCLE) {
  console.log('NODE_ENV is production and today is not the 7th or 21st of month, script aborted!');
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
  const reminder = date === 21 ? true : false;

  for (const card of cards) {
    try {
      const { id, CollectiveId, name } = card;
      const brand = card.data.brand || 'credit card';

      // Sometime, CollectiveId is missing, we'll need to see what to do for these
      if (!CollectiveId) {
        logger.info(`Missing CollectiveId for card ${id}, ignoring.`);
        continue;
      }
      const collective = await models.Collective.findByPk(CollectiveId);
      if (!collective) {
        logger.info(`Missing collective for card ${id}, ignoring.`);
        continue;
      }

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
          reminder,
        };

        logger.info(
          `Payment method ${data.id} for collective '${data.slug}' is expiring, sending an email to ${data.email}, reminder = ${reminder}`,
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
