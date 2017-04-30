
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


models.Group.findAll().map(group => getBackers(group)
  .then(backers => getStatus(group, backers))
  .then(status => status && tweetStatus(sequelize, group.id, status)))
.then(() => {
  console.log('Monthly reporting done!');
  process.exit();
}).catch(err => {
  console.log('err', err);
  process.exit();
});

function getBackers(group) {
  return sequelize.query(`
        SELECT
          ug."UserId" as id,
          u."twitterHandle" as "twitterHandle"
        FROM "UserGroups" ug
        LEFT JOIN "Users" u ON u.id = ug."UserId"
        WHERE ug."GroupId" = :GroupId
        AND ug.role = '${roles.BACKER}'
        AND ug."deletedAt" IS NULL
      `, {
    replacements: { GroupId: group.id },
    type: sequelize.QueryTypes.SELECT
  });
}

function getStatus(group, backers) {
  const backerCount = backers.length;
  // backers without twitterHandle are ignored
  const backerList = _.remove(backers, backer => backer.twitterHandle)
    .map(backer => `@${backer.twitterHandle}`)
    .join(' ');

  const longStatus = getStatusFromDetails(group, backerCount, backerList);
  if (!longStatus || longStatus.length <= 140) {
    return longStatus;
  }
  return getStatusFromDetails(group, backerCount, "");
}

function getStatusFromDetails(group, backerCount, backerList) {
  const twitterSettings = group.getTwitterSettings();
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
