const app = require('../index');
const models = app.set('models');
const moment = require('moment-timezone');
//const async = require('async');

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
};

var thisWeekRaw = moment()
    .tz('America/New_York')
    .startOf('isoWeek')
    .add(9, 'hours');
const thisWeek = thisWeekRaw.format();
const lastWeek = thisWeekRaw.subtract(1, 'week').format();
//const testDate = '2016-02-15T09:00:00-05:00';

//const createdAtClause = {
//  $gt: lastWeek,
//  $lt: thisWeek
//};
const createdAtClause = {
  $gt: lastWeek
};

models.Transaction
    .count({
      where: {
        createdAt: createdAtClause,
        tags: {
          $contains: ['Donation']
        }
      }
    })
    .then(donationCount => {
      console.log("donation count: "+ donationCount);
      done();
    })
    .catch(done);