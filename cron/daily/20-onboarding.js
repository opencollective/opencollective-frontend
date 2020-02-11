#!/usr/bin/env node
import '../../server/env';

import Promise from 'bluebird';
import models, { Op } from '../../server/models';
import { get } from 'lodash';
import { processOnBoardingTemplate } from '../../server/lib/onboarding';

const XDaysAgo = days => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - days);
};

Date.prototype.toString = function() {
  const mm = this.getMonth() + 1; // getMonth() is zero-based
  const dd = this.getDate();

  return [this.getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('-');
};

const onlyInactiveCollectives = collective => {
  return models.Transaction.count({
    where: { CollectiveId: collective.id },
  }).then(count => count === 0);
};

const onlyCollectivesWithoutExpenses = collective => {
  return models.Expense.count({ where: { CollectiveId: collective.id } }).then(count => count === 0);
};

const onlyCollectivesWithoutUpdates = collective => {
  return models.Update.count({
    where: { CollectiveId: collective.id, publishedAt: { [Op.ne]: null } },
  }).then(count => count === 0);
};

const onlyCollectivesWithoutTwitterActivated = collective => {
  return models.ConnectedAccount.findOne({
    where: { CollectiveId: collective.id, service: 'twitter' },
  }).then(twitterAccount => {
    if (!twitterAccount) {
      return true;
    }
    if (get(twitterAccount, 'settings.monthlyStats.active') && get(twitterAccount, 'settings.newBacker.active')) {
      return false;
    }
    return true;
  });
};

Promise.all([
  processOnBoardingTemplate('onboarding.day35.inactive', XDaysAgo(35), onlyInactiveCollectives),
  processOnBoardingTemplate('onboarding.day7', XDaysAgo(7)),
  processOnBoardingTemplate('onboarding.day21.noTwitter', XDaysAgo(21), onlyCollectivesWithoutTwitterActivated),
  processOnBoardingTemplate('onboarding.noExpenses', XDaysAgo(14), onlyCollectivesWithoutExpenses),
  processOnBoardingTemplate('onboarding.noUpdates', XDaysAgo(21), onlyCollectivesWithoutUpdates),
  processOnBoardingTemplate('onboarding.day3', XDaysAgo(3)),
  processOnBoardingTemplate('onboarding.day2', XDaysAgo(2)),
]).then(() => {
  console.log('>>> all done');
  process.exit(0);
});
