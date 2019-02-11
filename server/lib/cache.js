import md5 from 'md5';
import config from 'config';
import debug from 'debug';
import LRU from 'lru-cache';
import memjs from 'memjs';
import { has, get } from 'lodash';

import logger from './logger';
import models from '../models';

const debugCache = debug('cache');

const lruCache = new LRU({ max: 1000 });

const oneDayInSeconds = 60 * 60 * 24;

let memcache;
if (has(config, 'memcache.servers')) {
  debugCache('Memcache configuration detected, using memcache as cache backend.');
  const options = {};
  if (has(config, 'memcache.username') && has(config, 'memcache.password')) {
    options.username = get(config, 'memcache.username');
    options.password = get(config, 'memcache.password');
  }
  memcache = memjs.Client.create(get(config, 'memcache.servers'), options);
}

async function cacheGet(key, { unserialize = JSON.parse } = {}) {
  try {
    debugCache(`get ${key}`);
    if (memcache) {
      const data = await memcache.get(key);
      if (data.value) {
        const value = data.value.toString();
        try {
          return unserialize(value);
        } catch (err) {
          debugCache(`Invalid JSON (${value}): ${err}`);
        }
      }
    } else if (lruCache) {
      return lruCache.get(key);
    }
  } catch (err) {
    logger.warn(`Error while fetching from cache: ${err.message}`);
  }
}

async function cacheSet(key, value, maxAgeInSeconds = 0, { serialize = JSON.stringify } = {}) {
  try {
    debugCache(`set ${key}`);
    // debugCache(`set ${key} ${value}`);
    if (memcache) {
      if (value !== undefined) {
        memcache.set(key, serialize(value), { expires: maxAgeInSeconds });
      }
    } else if (lruCache) {
      lruCache.set(key, value, maxAgeInSeconds * 1000);
    }
  } catch (err) {
    logger.warn(`Error while writing to cache: ${err.message}`);
  }
}

async function cacheDel(key) {
  try {
    debugCache(`del ${key}`);
    if (memcache) {
      memcache.delete(key);
    } else if (lruCache) {
      lruCache.del(key);
    }
  } catch (err) {
    logger.warn(`Error while deleting from cache: ${err.message}`);
  }
}

async function cacheClear() {
  try {
    debugCache('clear');
    if (memcache) {
      memcache.flush();
    } else if (lruCache) {
      lruCache.reset();
    }
  } catch (err) {
    logger.warn(`Error while clearing cache: ${err.message}`);
  }
}

async function cacheHas(key) {
  try {
    debugCache(`has ${key}`);
    if (memcache) {
      const value = await memcache.get(key);
      return value !== undefined;
    } else if (lruCache) {
      return lruCache.has(key);
    }
  } catch (err) {
    logger.warn(`Error while checking from cache: ${err.message}`);
  }
  return false;
}

export async function fetchCollectiveId(collectiveSlug) {
  const cacheKey = `collective_id_with_slug_${collectiveSlug}`;
  const collectiveId = await cacheGet(cacheKey);
  if (collectiveId) {
    return collectiveId;
  }
  const collective = await models.Collective.findOne({
    attributes: ['id'],
    where: { slug: collectiveSlug.toLowerCase() },
  });
  cacheSet(cacheKey, collective.id, oneDayInSeconds);
  return collective.id;
}

export function memoize(func, { key, maxAge = 0, serialize, unserialize }) {
  const cacheKey = args => {
    return args.length ? `${key}_${md5(JSON.stringify(args))}` : key;
  };

  const memoizedFunction = async function() {
    let value = await cacheGet(cacheKey(arguments), { unserialize });
    if (value === undefined) {
      value = await func(...arguments);
      cacheSet(cacheKey(arguments), value, maxAge, { serialize });
    }
    return value;
  };

  memoizedFunction.refresh = async function() {
    const value = await func(...arguments);
    cacheSet(cacheKey(arguments), value, maxAge, { serialize });
  };

  memoizedFunction.clear = async function() {
    cacheDel(cacheKey(arguments));
  };

  return memoizedFunction;
}

export default {
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  has: cacheHas,
  clear: cacheClear,
};
