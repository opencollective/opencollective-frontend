import queries from '../lib/queries';
import models from '../models';
import { memoize } from 'lodash';
memoize.Cache = Map;

const getTotalAnnualBudget = memoize(queries.getTotalAnnualBudget);

/**
 * get total number of active collectives
 * (a collective is considered as active if it has ever received any funding from its host or through a order)
 */
const getTotalCollectives = memoize(() => {
  console.log(">>> update total number of active collectives")
  return queries.getTotalNumberOfActiveCollectives();
});

const getTotalDonors = memoize(() => {
  return queries.getTotalNumberOfDonors();
});

const getTopCollectives = memoize((tag) => {
  console.log(">>> update top collectives in ", tag);
  return models.Collective.getCollectivesSummaryByTag(tag, 3, [], 100000, true);
})

const refreshCache = () => {
  console.log(">>> Refreshing cache for homepage");
  getTopCollectives.cache.clear();
  getTotalCollectives.cache.clear();
  getTotalDonors.cache.clear();
  getTopCollectives('open source'),
  getTopCollectives('meetup'),
  getTotalDonors(),
  getTotalCollectives()
}

// We only use the cache on staging and production
const useCache = ['production', 'staging'].indexOf(process.env.NODE_ENV) !== -1;

// Update the cache every hour
if (useCache) {
  getTotalCollectives();
  getTopCollectives('open source');
  getTopCollectives('meetup');
  setInterval(refreshCache, 1000 * 60 * 60);
}

export default (req, res, next) => {

  // We skip the cache when testing
  if (!useCache) {
    getTopCollectives.cache.clear();
    getTotalCollectives.cache.clear();
    getTotalDonors.cache.clear();
  }

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
