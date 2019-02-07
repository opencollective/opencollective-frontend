import LRU from 'lru-cache';

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

export default makeMemoryProvider;
