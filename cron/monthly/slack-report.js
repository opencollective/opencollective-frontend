
// Only run on the first of the month
const today = new Date();
if (process.env.NODE_ENV === 'production' && today.getDate() !== 1) {
  console.log('NODE_ENV is production and today is not the first of month, script aborted!');
  process.exit();
}

import _ from 'lodash';
import models, {sequelize} from '../../server/models';
import roles from '../../server/constants/roles';
import {tweetStatus} from '../../server/lib/twitter';


models.Collective.findAll().map(collective => getBackers(collective)
  .then(backers => getStatus(collective, backers))
  .then(status => status && tweetStatus(sequelize, collective.id, status)))
.then(() => {
  console.log('Monthly reporting done!');
  process.exit();
}).catch(err => {
  console.log('err', err);
  process.exit();
});

function getBackers(collective) {
  return sequelize.query(`
        SELECT
          ug."CreatedByUserId" as id,
          c."twitterHandle" as "twitterHandle"
        FROM "Members" ug
        LEFT JOIN "Collectives" c ON c.id = ug."MemberCollectiveId"
        WHERE ug."CollectiveId" = :CollectiveId
        AND ug.role = '${roles.BACKER}'
        AND ug."deletedAt" IS NULL
      `, {
    replacements: { CollectiveId: collective.id },
    type: sequelize.QueryTypes.SELECT
  });
}

function getStatus(collective, backers) {
  const backerCount = backers.length;
  // backers without twitterHandle are ignored
  const backerList = _.remove(backers, backer => backer.twitterHandle)
    .map(backer => `@${backer.twitterHandle}`)
    .join(' ');

  const longStatus = getStatusFromDetails(collective, backerCount, backerList);
  if (!longStatus || longStatus.length <= 140) {
    return longStatus;
  }
  return getStatusFromDetails(collective, backerCount, "");
}

function getStatusFromDetails(collective, backerCount, backerList) {
  const twitterSettings = collective.getTwitterSettings();
  if (backerCount === 0 || !twitterSettings.monthlyThankDonationsEnabled) {
    return null;
  }
  if (backerCount === 1) {
    return twitterSettings.monthlyThankDonationsSingular
      .replace('$backer', backerList);
  }
  return twitterSettings.monthlyThankDonationsPlural
    .replace('$backerCount', backerCount)
    .replace('$backerList', backerList)
    .replace('  ', ' ');
}
