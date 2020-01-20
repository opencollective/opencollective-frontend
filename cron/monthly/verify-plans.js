#!/usr/bin/env node
import '../../server/env';

// Only run on the first of the month
const today = new Date();
if (process.env.NODE_ENV === 'production' && today.getDate() !== 1) {
  console.log('NODE_ENV is production and today is not the first of month, script aborted!');
  process.exit();
}

import { Op } from 'sequelize';
import { groupBy } from 'lodash';
import debugLib from 'debug';

import models from '../../server/models';
import plans, { PLANS_COLLECTIVE_SLUG } from '../../server/constants/plans';
import orderStatus from '../../server/constants/order_status';
import emailLib from '../../server/lib/email';

const debug = debugLib('verify-plans');

const REPORT_EMAIL = 'ops@opencollective.com';

const LEVELS = {
  LEGACY: 'LEGACY',
  DOWNGRADE: 'DOWNGRADE',
  CANCEL: 'CANCEL',
  EXCEPTION: 'EXCEPTION',
};

/**
 * Makes sure all collectives.plan are up-to-date, downgrading and cancelling plans if needed.
 */
export async function run() {
  const opencollective = await models.Collective.findOne({
    where: { slug: PLANS_COLLECTIVE_SLUG },
    include: [{ model: models.Tier, as: 'tiers', where: { type: 'TIER', deletedAt: null } }],
  });
  const existingPlansSlugs = opencollective.tiers.map(tier => tier.slug);
  const collectives = await models.Collective.findAll({ where: { plan: { [Op.ne]: null } } });
  debug(`There is/are ${collectives.length} subscribed to our plans...`);

  const info = [];

  for (const collective of collectives) {
    debug(`Processing collective #${collective.id}...`);
    // Custom or legacy plans, we're ignoring this because this was manually set.
    if (!plans[collective.plan]) {
      const message = `${collective.slug} is using legacy plan, ignoring.`;
      debug(message);
      return info.push({
        level: LEVELS.LEGACY,
        message,
      });
    }

    const lastOrder = await models.Order.findOne({
      include: [
        { model: models.Collective, as: 'collective', where: { slug: PLANS_COLLECTIVE_SLUG } },
        { model: models.Collective, as: 'fromCollective', where: { id: collective.id } },
        { model: models.Subscription, as: 'Subscription' },
        { model: models.Tier, as: 'Tier', where: { slug: { [Op.in]: existingPlansSlugs } } },
      ],
      order: [['updatedAt', 'DESC']],
    });

    if (!lastOrder) {
      const message = `Collective ${collective.slug} is set to ${collective.plan} but has no order related to that.`;
      debug(message);
      return;
    }
    const lastOrderPlan = lastOrder.Tier.slug;
    // Last order matches the plan and it is still active.
    if (collective.plan === lastOrderPlan && lastOrder.status === orderStatus.ACTIVE) {
      return;
    }
    // Last order matches the plan but was cancelled.
    else if (collective.plan === lastOrderPlan && lastOrder.status === orderStatus.CANCELLED) {
      const message = `Collective ${collective.slug} cancelled ${collective.plan}.`;
      debug(message);
      await collective.update({ plan: null });
      return info.push({
        level: LEVELS.CANCEL,
        message,
      });
    }
    // Last order doesn't match the current plan, must have been downgraded since upgrades
    // are updated in real time.
    else if (collective.plan !== lastOrderPlan && lastOrder.status === orderStatus.ACTIVE) {
      const message = `Collective ${collective.slug} downgraded from ${collective.plan} to ${lastOrderPlan}.`;
      debug(message);
      await collective.update({ plan: lastOrderPlan });
      return info.push({
        level: LEVELS.DOWNGRADE,
        message,
      });
    } else {
      const message = `Collective ${collective.slug} is set to ${collective.plan} but its last plan update is ${lastOrderPlan}. Please investigate.`;
      debug(message);
      return info.push({
        level: LEVELS.EXCEPTION,
        message,
      });
    }
  }

  return info;
}

const script = async () => {
  const info = await run();

  const { LEGACY, DOWNGRADE, CANCEL, EXCEPTION } = groupBy(info, 'level');
  let body = [];
  let subjectIcon;

  if (LEGACY) {
    subjectIcon = 'ℹ️';
    body = [`ℹ️ Other plans being used:\n`, ...LEGACY.map(info => `${info.message}\n`)];
  }
  if (DOWNGRADE) {
    subjectIcon = '👎';
    body = [`👎 Downgrades:\n`, ...DOWNGRADE.map(info => `${info.message}\n`), `\n`, ...body];
  }
  if (CANCEL) {
    subjectIcon = '🚫';
    body = [`🚫 Cancellations:\n`, ...CANCEL.map(info => `${info.message}\n`), `\n`, ...body];
  }
  if (EXCEPTION) {
    subjectIcon = '🚨';
    body = [`🚨 Exceptions:\n`, ...EXCEPTION.map(info => `${info.message}\n`), `\n`, ...body];
  }

  if (body.length === 0) {
    const text = `No pending subscriptions found, every Collective.plan is matching its subscription.`;
    const subject = `Ø Monthly Plan Verification Report`;
    emailLib.sendMessage(REPORT_EMAIL, subject, '', { text });
  } else if (body.length > 0) {
    // Build & send message
    const text = body.join('\n');
    const subject = `${subjectIcon} Monthly Plan Verification Report`;
    emailLib.sendMessage(REPORT_EMAIL, subject, '', { text });
  }
};

if (require.main === module) {
  script();
}
