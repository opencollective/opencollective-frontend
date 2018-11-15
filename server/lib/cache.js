import config from 'config';
import debug from 'debug';
import LRU from 'lru-cache';
import Memcached from 'memcached-promisify';
import { get, has } from 'lodash';

import models from '../models';

const debugCache = debug('cache');

const lru = LRU({ max: 1000 });

const oneDayInSeconds = 60 * 60 * 24;

let memcached;
if (has(config, 'memcached.locations')) {
  memcached = new Memcached(get(config, 'memcached.locations'));
}

async function cacheGet(key) {
  debugCache(`get ${key}`);
  if (memcached) {
    return memcached.get(key);
  } else if (lru) {
    return lru.get(key);
  }
}

async function cacheSet(key, value, maxAgeInSeconds = 0) {
  debugCache(`set ${key} ${value}`);
  if (memcached) {
    return memcached.set(key, value, maxAgeInSeconds);
  } else if (lru) {
    return lru.set(key, value, maxAgeInSeconds * 1000);
  }
}

async function cacheDel(key) {
  debugCache(`del ${key}`);
  if (memcached) {
    return memcached.del(key);
  } else if (lru) {
    return lru.del(key);
  }
}

async function cacheClear() {
  debugCache('clear');
  if (lru) {
    return lru.reset();
  }
}

async function cacheHas(key) {
  debugCache(`has ${key}`);
  if (memcached) {
    const value = await memcached.get(key);
    return value !== undefined;
  } else if (lru) {
    return lru.has(key);
  } else {
    return false;
  }
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

export default {
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  has: cacheHas,
  clear: cacheClear,
};
