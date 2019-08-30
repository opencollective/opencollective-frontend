#!/usr/bin/env node
import '../server/env';

/*
 * This script calculates how many new backers and old backers we have added by calendar months
 */

console.log('This script is being deprecated.');
console.log('To re-enable it, remove this message with a Pull Request explaining the use case.');
process.exit();

/*
import fs from 'fs';
import { parse as json2csv } from 'json2csv';

import models, { Op } from '../server/models';

const done = err => {
  if (err) console.log(err);
  console.log('\ndone!\n');
  ``;
  process.exit();
};

const results = {};
// const csvFields = ['id', 'slug', 'newBackerCount', 'oldBackerCount'];
const outputFilename = 'new_backer_count_output.csv';

const getMonthYearKeyFromDate = date => {
  return `${date.getUTCFullYear()}-${`0${date.getUTCMonth() + 1}`.slice(-2)}`;
};

const calculateNewBackersPerMonth = () => {
  const seenFromCollectiveIdList = {};

  return models.Order.findAll({
    where: {
      CollectiveId: {
        [Op.notIn]: [1],
      },
    },
    include: [
      { model: models.Collective, as: 'fromCollective', paranoid: false },
      { model: models.Collective, as: 'collective', paranoid: false },
    ],
    order: ['id'],
  })
    .tap(orders => console.log('Orders found: ', orders.length))
    .each(order => {
      const dateKey = getMonthYearKeyFromDate(order.createdAt);
      if (order.FromCollectiveId in seenFromCollectiveIdList) {
        if (dateKey in results) {
          results[dateKey]['oldBackers'] += 1;
        } else {
          results[dateKey] = { newBackers: 0, oldBackers: 1 };
        }
      } else {
        // means this is a new backer
        seenFromCollectiveIdList[order.FromCollectiveId] = true;
        if (dateKey in results) {
          results[dateKey]['newBackers'] += 1;
        } else {
          results[dateKey] = { newBackers: 1, oldBackers: 0 };
        }
      }
    })
    .then(() => {
      const csvFields = ['month', 'newBackers', 'oldBackers'];
      console.log(results);
      const data = Object.keys(results).map(result => ({
        month: result,
        newBackers: results[result].newBackers,
        oldBackers: results[result].oldBackers,
      }));
      console.log(data);

      console.log('Writing the output to', outputFilename);
      try {
        const csv = json2csv(data, { fields: csvFields });
        fs.writeFileSync(outputFilename, csv);
      } catch (err) {
        console.log(err);
      }
    });
};

const run = () => {
  console.log('\nStarting calc_new_backers_per_month...');

  return calculateNewBackersPerMonth()
    .then(() => done())
    .catch(done);
};

run();

*/
