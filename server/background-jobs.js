import queries from './lib/queries';

const noCache = process.env.NO_CACHE;

const oneHourInMilliseconds = 60 * 60 * 1000;

const cacheRefreshInterval =
  process.env.CACHE_REFRESH_INTERVAL || oneHourInMilliseconds;

// warming up the cache with the homepage queries
const cacheEntries = [
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

const refreshCache = async () => {
  for (const entry of cacheEntries) {
    entry.func.refresh(entry.params);
  }
};

export default () => {
  console.log('Starting Background Jobs.');
  if (!noCache) {
    console.log('- starting refreshCache');
    setInterval(refreshCache, cacheRefreshInterval);
    refreshCache();
  }
};
