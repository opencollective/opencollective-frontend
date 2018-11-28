import config from 'config';

import { memoize } from '../lib/cache';
import queries from '../lib/queries';
import models from '../models';

const homepageTags = ['open source', 'meetup'];

/**
 * get total number of active collectives
 * (a collective is considered as active if it has ever received any funding from its host or through a order)
 */
const getTotalCollectives = memoize(queries.getTotalNumberOfActiveCollectives, {
  key: 'homepage_total_collectives',
});

const getTotalDonors = memoize(queries.getTotalNumberOfDonors, {
  key: 'homepage_total_donors',
});

const getTotalAnnualBudget = memoize(queries.getTotalAnnualBudget, {
  key: 'homepage_annual_budget',
});

const getTopCollectives = memoize(
  tag => models.Collective.getCollectivesSummaryByTag(tag, 3, [], 100000, true).then(({ collectives }) => collectives),
  { key: 'homepage_top_collectives' },
);

const getTotalSponsors = memoize(queries.getTopSponsors, {
  key: 'homepage_top_sponsors',
});

const clearCache = () => {
  getTotalCollectives.clear();
  getTotalDonors.clear();
  getTotalAnnualBudget.clear();
  getTopCollectives.clear(homepageTags[0]);
  getTopCollectives.clear(homepageTags[1]);
  getTotalSponsors.clear();
};

const refreshCache = () => {
  getTotalCollectives.refresh();
  getTotalDonors.refresh();
  getTotalAnnualBudget.refresh();
  getTopCollectives.refresh(homepageTags[0]);
  getTopCollectives.refresh(homepageTags[1]);
  getTotalSponsors.refresh();
};

// Update the cache now and every hour
if (!config.cache.homepage.disabled) {
  refreshCache();
  setInterval(refreshCache, config.cache.homepage.refreshInterval * 1000);
}

export default (req, res, next) => {
  // We skip the cache when testing
  if (config.cache.homepage.disabled) {
    clearCache();
  }

  Promise.all([
    getTotalCollectives(),
    getTotalDonors(),
    getTotalAnnualBudget(),
    getTopCollectives(homepageTags[0]),
    getTopCollectives(homepageTags[1]),
    getTotalSponsors(),
  ])
    .then(results => {
      const hp = {
        stats: {
          totalCollectives: results[0],
          totalDonors: results[1],
          totalAnnualBudget: results[2],
        },
        collectives: {
          opensource: results[3],
          meetup: results[4],
        },
        sponsors: results[5],
      };
      res.send(hp);
    })
    .catch(err => {
      console.log('Homepage Error', err);
      next();
    });
};
