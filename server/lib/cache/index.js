import config from 'config';
import debug from 'debug';
import { get } from 'lodash';

import makeMemcacheProvider from './memcache';
import makeMemoryProvider from './memory';
import makeRedisProvider from './redis';

import logger from '../logger';
import models from '../../models';
import { md5 } from '../utils';

export const PROVIDER_TYPES = {
  MEMCACHE: 'MEMCACHE',
  MEMORY: 'MEMORY',
  REDIS: 'REDIS',
};

const debugCache = debug('cache');

const oneDayInSeconds = 60 * 60 * 24;

export const getProvider = providerType => {
  switch (providerType) {
    case PROVIDER_TYPES.MEMCACHE:
      return makeMemcacheProvider(get(config, 'memcache'));
    case PROVIDER_TYPES.REDIS:
      return makeRedisProvider(get(config, 'redis'));
    case PROVIDER_TYPES.MEMORY:
      return makeMemoryProvider({ max: 1000 });
    default:
      throw new Error(`Unsupported cache provider: ${providerType}`);
  }
};

const getDefaultProviderType = () => {
  if (get(config, 'redis.serverUrl')) {
    return PROVIDER_TYPES.REDIS;
  } else if (get(config, 'memcache.servers')) {
    return PROVIDER_TYPES.MEMCACHE;
  } else {
    return PROVIDER_TYPES.MEMORY;
  }
};

let defaultProvider;

const getDefaultProvider = () => {
  const defaultProviderType = getDefaultProviderType();
  if (!defaultProvider) {
    defaultProvider = getProvider(defaultProviderType);
  }
  return defaultProvider;
};

const cache = {
  clear: async () => {
    try {
      debugCache('clear');
      return getDefaultProvider().clear();
    } catch (err) {
      logger.warn(`Error while clearing cache: ${err.message}`);
    }
  },
  del: async key => {
    try {
      debugCache(`del ${key}`);
      return getDefaultProvider().del(key);
    } catch (err) {
      logger.warn(`Error while deleting from cache: ${err.message}`);
    }
  },
  get: async (key, options) => {
    try {
      debugCache(`get ${key}`);
      return getDefaultProvider().get(key, options);
    } catch (err) {
      logger.warn(`Error while fetching from cache: ${err.message}`);
    }
  },
  has: async key => {
    try {
      debugCache(`has ${key}`);
      return getDefaultProvider().has(key);
    } catch (err) {
      logger.warn(`Error while checking from cache: ${err.message}`);
    }
  },
  set: async (key, value, expirationInSeconds, options) => {
    try {
      debugCache(`set ${key}`);
      return getDefaultProvider().set(key, value, expirationInSeconds, options);
    } catch (err) {
      logger.warn(`Error while writing to cache: ${err.message}`);
    }
  },
};

export async function fetchCollectiveId(collectiveSlug) {
  const cacheKey = `collective_id_with_slug_${collectiveSlug}`;
  const collectiveId = await cache.get(cacheKey);
  if (collectiveId) {
    return collectiveId;
  }
  const collective = await models.Collective.findOne({
    attributes: ['id'],
    where: { slug: collectiveSlug.toLowerCase() },
  });
  if (collective) {
    cache.set(cacheKey, collective.id, oneDayInSeconds);
    return collective.id;
  }
}

export function memoize(func, { key, maxAge = 0, serialize, unserialize }) {
  const cacheKey = args => {
    return args.length ? `${key}_${md5(JSON.stringify(args))}` : key;
  };

  const memoizedFunction = async function() {
    let value = await cache.get(cacheKey(arguments), { unserialize });
    if (value === undefined) {
      value = await func(...arguments);
      cache.set(cacheKey(arguments), value, maxAge, { serialize });
    }
    return value;
  };

  memoizedFunction.refresh = async function() {
    const value = await func(...arguments);
    cache.set(cacheKey(arguments), value, maxAge, { serialize });
  };

  memoizedFunction.clear = async function() {
    cache.del(cacheKey(arguments));
  };

  return memoizedFunction;
}

export default cache;
