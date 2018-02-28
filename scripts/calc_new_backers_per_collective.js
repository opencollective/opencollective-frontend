/*
 * This script runs breaks out how many new and old backers are added per active month per collective
 */

import Promise from 'bluebird';
import fs from 'fs';
import moment from 'moment';
import json2csv from 'json2csv';
import models, { sequelize } from '../server/models';


const done = (err) => {
  if (err) console.log(err);
  console.log('\ndone!\n');``
  process.exit();
}

const results = {};
const arrayLength = 30;
const outputFilename = 'backer_count_output.csv';

const initiateNewCollectiveStats = (firstOrder, isNewBacker) => {

  const generateMonths = (collectiveStats) => {
    const numArray = Array.apply(null, {length: arrayLength}).map(Number.call, Number).slice(2, arrayLength);

    numArray.map(i => {
      collectiveStats.months[i] = {
        newBackerCount: 0,
        oldBackerCount: 0
      }
    });

    return collectiveStats;
  }

  const collectiveStats = {
    id: firstOrder.CollectiveId,
    slug: firstOrder.collective.slug,
    months: {
      1: {
        date: firstOrder.createdAt,
        newBackerCount: isNewBacker ? 1 : 0,
        oldBackerCount: isNewBacker ? 0 : 1
      }
    }
  }
  const newCollectiveStats = generateMonths(collectiveStats);
  console.log("newCollectiveStats", newCollectiveStats);
  return newCollectiveStats;  
};

const countOrderInStats = (order, isNewBacker) => {
  // calculate which month slot it should go in

  const orderStats = results[order.CollectiveId];

  const newOrderDate = moment(order.createdAt);
  let diff = newOrderDate.diff(moment(orderStats.months['1'].date));

  console.log(orderStats);
  console.log(order.createdAt, orderStats.months['1'].date, diff);

  if (diff < 0) diff = 0;

  const month = Math.floor(diff / 1000 / 3600 / 24 / 30) % 30 + 1;

  console.log("month", month);

  if (isNewBacker) {
    orderStats.months[`${month}`].newBackerCount += 1;
  } else {
    orderStats.months[`${month}`].oldBackerCount += 1;
  }
}

const calculateBackersPerCollective = () => {

  const seenFromCollectiveIdList = {};

  return models.Order.findAll({
    where: {
      /*PaymentMethodId: {
        $not: null
      }*/
      CollectiveId: {
        [sequelize.Op.notIn]: [ 1 ]
      }, 
    },
    include: [
      { model: models.Collective, as: 'fromCollective', paranoid: false }, 
      { model: models.Collective, as: 'collective', paranoid: false }
    ],
    order: ['id']
  })
  .tap(orders => console.log('Orders found: ', orders.length))
  .each(order => {
    if (order.FromCollectiveId in seenFromCollectiveIdList) {
      // means this is now an old backer
      if (order.CollectiveId in results) {
        //results[order.CollectiveId]['oldBackerCount'] += 1;
        countOrderInStats(order, false);
      } else {
        //results[order.CollectiveId] = { id: order.CollectiveId, slug: order.collective.slug, newBackerCount: 0, oldBackerCount: 1};
        results[order.CollectiveId] = initiateNewCollectiveStats(order, false);
      }
    } else {
      // means this is a new backer
      seenFromCollectiveIdList[order.FromCollectiveId] = true;
      if (order.CollectiveId in results) {
        //results[order.CollectiveId]['newBackerCount'] += 1;
        countOrderInStats(order, true);
      } else {
        // results[order.CollectiveId] = { id: order.CollectiveId, slug: order.collective.slug, newBackerCount: 1, oldBackerCount: 0};
        results[order.CollectiveId] = initiateNewCollectiveStats(order, true);
      }
    }
  })
  .then(() => {
    let csvFields = ['id', 'slug'];
    const array = Array.apply(null, {length: arrayLength}).map(Number.call, Number).slice(0, -1);

    array.map(n => csvFields = csvFields.concat([`month${n+1}NewBackerCount`, `month${n+1}OldBackerCount`]));

    console.log(csvFields);

    //console.log(results);

    console.log(array);

    const data = Object.keys(results).map(key => {
      const obj = { id: results[key].id, slug: results[key].slug};
      array.map(n => {
        console.log(`${n+1}`, results[key].months[`${n+1}`]);
        obj[`month${n+1}NewBackerCount`] = results[key].months[`${n+1}`].newBackerCount;
        obj[`month${n+1}OldBackerCount`] = results[key].months[`${n+1}`].oldBackerCount;
      })
      return obj;
    });

    console.log('data', data);

    json2csv({ data, fields: csvFields }, (err, csv) => {
      console.log('Writing the output to', outputFilename);
      if (err) console.log(err);
      fs.writeFileSync(outputFilename, csv)
    });
  })

}

const run = () => {
  console.log('\nStarting calc_new_backers_per_collective...')
  
  return calculateBackersPerCollective()
  .then(() => done())
  .catch(done)
}

run();
