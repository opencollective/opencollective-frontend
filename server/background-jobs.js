import Promise from 'bluebird';

import queries from './lib/queries';

const useCache = ['production', 'staging'].includes(process.env.NODE_ENV);
const CACHE_REFRESH_INTERVAL =
  process.env.CACHE_REFRESH_INTERVAL || 1000 * 60 * 60;

// warming up the cache with the homepage queries
const cacheEntries = [
  {
    method: 'getCollectivesOrderedByMonthlySpending',
    params: {
      type: 'COLLECTIVE',
      orderBy: 'monthlySpending',
      orderDirection: 'DESC',
      limit: 4,
      offset: 0,
      where: { type: 'COLLECTIVE' },
    },
  },
  {
    method: 'getCollectivesOrderedByMonthlySpending',
    params: {
      type: 'ORGANIZATION',
      orderBy: 'monthlySpending',
      orderDirection: 'DESC',
      limit: 6,
      offset: 0,
      where: { type: 'ORGANIZATION' },
    },
  },
  {
    method: 'getCollectivesOrderedByMonthlySpending',
    params: {
      type: 'USER',
      orderBy: 'monthlySpending',
      orderDirection: 'DESC',
      limit: 30,
      offset: 0,
      where: { type: 'USER' },
    },
  },
  {
    method: 'getCollectivesWithMinBackers',
    params: {
      type: 'COLLECTIVE',
      isActive: true,
      minBackerCount: 10,
      orderBy: 'createdAt',
      orderDirection: 'DESC',
      limit: 4,
      offset: 0,
      where: { type: 'COLLECTIVE', isActive: true },
    },
  },
];

const refreshCache = async () => {
  Promise.each(cacheEntries, async entry => {
    const res = queries[`${entry.method}Query`](entry.params);
    queries[entry.method].cache.set(JSON.stringify(entry.params), res);
  });
};

export default () => {
  console.log('Starting Background Jobs.');
  if (useCache) {
    console.log('- starting refreshCache');
    setInterval(refreshCache, CACHE_REFRESH_INTERVAL);
    refreshCache();
  }
};
