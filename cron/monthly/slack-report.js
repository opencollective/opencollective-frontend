import app from '../../index';
const models = app.set('models');
import _ from 'lodash';
import roles from '../../server/constants/roles';
import twitter from '../../server/lib/twitter';
onlyExecuteInProdOn1stDayOfTheMonth();


models.Group.findAll().map(group => getBackers(group)
  .then(backers => getStatus(group, backers))
  .then(status => status && twitter.tweetStatus(models.sequelize, group.id, status)))
.then(() => {
  console.log('Monthly reporting done!');
  process.exit();
}).catch(err => {
  console.log('err', err);
  process.exit();
});

function onlyExecuteInProdOn1stDayOfTheMonth() {
  const dayOfMonth = new Date().getDate();
  if (process.env.NODE_ENV === 'production' && dayOfMonth !== 1) {
    console.log('NODE_ENV is production and it is not first day of the month, script aborted!');
    process.exit();
  }
}

function getBackers(group) {
  return models.sequelize.query(`
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
    type: models.sequelize.QueryTypes.SELECT
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
