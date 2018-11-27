import config from 'config';

import queries from './lib/queries';

// warming up the cache with the homepage queries
const cacheHomepageEntries = [
  {
    func: queries.getCollectivesOrderedByMonthlySpending,
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
    func: queries.getCollectivesOrderedByMonthlySpending,
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
    func: queries.getCollectivesOrderedByMonthlySpending,
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
    func: queries.getCollectivesWithMinBackers,
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

const cacheHomepageRefresh = async () => {
  for (const entry of cacheHomepageEntries) {
    entry.func.refresh(entry.params);
  }
};

export default () => {
  console.log('Starting Background Jobs.');
  if (!config.cache.homepage.disabled) {
    console.log('- starting cacheHomepageRefresh');
    setInterval(cacheHomepageRefresh, config.cache.homepage.refreshInterval * 1000);
    cacheHomepageRefresh();
  }
};
