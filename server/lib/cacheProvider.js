import config from 'config';
import debug from 'debug';
import LRU from 'lru-cache';
import memjs from 'memjs';
import redis from 'redis';
import { has, get, isFunction } from 'lodash';
import { promisify } from 'util';

import logger from './logger';

const debugCache = debug('cache');

export const PROVIDER_TYPES = {
  MEMCACHE: 'MEMCACHE',
  MEMORY: 'MEMORY',
  REDIS: 'REDIS',
};

let defaultProvider = PROVIDER_TYPES.MEMORY;
if (has(config, 'memcache.servers')) defaultProvider = PROVIDER_TYPES.MEMCACHE;
else if (has(config, 'redis.serverUrl')) defaultProvider = PROVIDER_TYPES.REDIS;

const makeMemcacheProvider = ({ servers, username, password }, { serialize, unserialize }) => {
  const client = memjs.Client.create(servers, { username, password });
  return {
    clear: async () => client.flush(),
    del: async key => client.delete(key),
    get: async key => {
      const data = await client.get(key);
      if (data.value) {
        const value = data.value.toString();
        try {
          return unserialize(value);
        } catch (err) {
          debugCache(`Invalid JSON (${value}): ${err}`);
        }
      }
    },
    has: async key => {
      const value = await client.get(key);
      return value !== undefined;
    },
    set: async (key, value, expirationInSeconds = 0) => {
      if (value !== undefined) return client.set(key, serialize(value), { expires: expirationInSeconds });
    },
  };
};

const makeRedisProvider = ({ serverUrl, opts }, { serialize, unserialize }) => {
  const client = redis.createClient(serverUrl, opts);
  const asyncFlushAll = promisify(client.flushall).bind(client);
  const asyncDel = promisify(client.del).bind(client);
  const asyncGet = promisify(client.get).bind(client);
  const asyncSet = promisify(client.set).bind(client);
  const asyncSetex = promisify(client.setex).bind(client);
  return {
    clear: async () => asyncFlushAll(),
    del: async key => asyncDel(key),
    get: async key => {
      const value = await asyncGet(key);
      if (value) {
        try {
          return unserialize(value);
        } catch (err) {
          debugCache(`Invalid JSON (${value}): ${err}`);
        }
      } else return undefined;
    },
    has: async key => {
      const value = await asyncGet(key);
      return value !== null;
    },
    set: async (key, value, expirationInSeconds) => {
      if (value !== undefined && expirationInSeconds) return asyncSetex(key, expirationInSeconds, serialize(value));
      if (value !== undefined) return asyncSet(key, serialize(value));
    },
  };
};

const makeMemoryProvider = opts => {
  const lruCache = new LRU(opts);
  return {
    clear: async () => lruCache.reset(),
    del: async key => lruCache.del(key),
    get: async key => lruCache.get(key),
    has: async key => lruCache.has(key),
    set: async (key, value, expirationInSeconds) => lruCache.set(key, value, expirationInSeconds * 1000),
  };
};

const unfailable = provider =>
  new Proxy(provider, {
    get(target, key) {
      if (isFunction(target[key])) {
        return (arg1, arg2, arg3) => {
          try {
            return target[key](arg1, arg2, arg3);
          } catch (err) {
            logger.warn(`Error on cache.${key}: ${err.message}`);
          }
        };
      } else return target[key];
    },
  });

export const getProvider = (
  provider = defaultProvider,
  { serialize, unserialize } = { serialize: JSON.stringify, unserialize: JSON.parse },
) => {
  switch (provider) {
    case PROVIDER_TYPES.MEMCACHE:
      debugCache('Memcache configuration detected, using memcache as cache backend.');
      return unfailable(
        makeMemcacheProvider(
          {
            password: get(config, 'memcache.password'),
            servers: get(config, 'memcache.servers'),
            username: get(config, 'memcache.username'),
          },
          { serialize, unserialize },
        ),
      );
    case PROVIDER_TYPES.REDIS:
      debugCache('Redis configuration detected, using redis as cache backend.');
      return unfailable(makeRedisProvider(has(config, 'redis.serverUrl'), { serialize, unserialize }));
    default:
      debugCache('Using memory as the default cache backend.');
      return unfailable(makeMemoryProvider({ max: 1000 }));
  }
};
