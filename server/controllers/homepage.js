import queries from '../lib/queries';
import models from '../models';
import { memoize } from 'lodash';

const getTotalAnnualBudget = memoize(queries.getTotalAnnualBudget);

/**
 * get total number of active collectives
 * (a collective is considered as active if it has ever received any funding from its host or through a order)
 */
const getTotalCollectives = memoize(() => {
  console.log(">>> update total number of collectives")
  return models.Transaction.aggregate('CollectiveId', 'count', {
    distinct: true,
    where: {
      amount: { $gt: 0 }
    }
  })
});

const getTotalDonors = memoize(() => {
  return models.Transaction.aggregate('FromCollectiveId', 'count', {
    distinct: true,
    where: {
      amount: { $gt: 0 },
      PaymentMethodId: { $ne: null }
    }
  })
});

const getTopCollectives = memoize((tag) => {
  console.log(">>> update top collectives in ", tag);
  return models.Collective.getCollectivesSummaryByTag(tag, 3, [], 100000, true);
})

// Update the cache every hour
getTotalCollectives();
getTopCollectives('open source');
getTopCollectives('meetup');
setInterval(() => {
  getTopCollectives.Cache = WeakMap;
  getTopCollectives('open source');
  getTopCollectives('meetup');
}, 1000 * 60 * 60);

export default (req, res, next) => {

  Promise.all([
    getTotalCollectives(),
    getTotalDonors(),
    getTotalAnnualBudget(),
    getTopCollectives('open source'),
    getTopCollectives('meetup'),
    queries.getTopSponsors()
  ])
  .then(results => {
    const hp = {
      stats: {
        totalCollectives: results[0],
        totalDonors: results[1],
        totalAnnualBudget: results[2]
      },
      collectives: {
        opensource: results[3],
        meetup: results[4]
      },
      sponsors: results[5]
    }
    res.send(hp);
  })
  .catch(next);
};
