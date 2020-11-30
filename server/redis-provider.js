const Promise = require('bluebird');
const redis = require('redis');

const asyncRedis = Promise.promisifyAll(redis);

const redisProvider = ({ serverUrl }) => {
  const client = asyncRedis.createClient(serverUrl);
  return {
    clear: async () => client.flushallAsync(),
    del: async key => client.delAsync(key),
    get: async key => {
      const value = await client.getAsync(key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch (err) {
          console.log(`redisProvider: Invalid JSON (${value}): ${err}`);
        }
      } else {
        return undefined;
      }
    },
    has: async key => {
      const value = await client.getAsync(key);
      return value !== null;
    },
    set: async (key, value, ttlInSeconds) => {
      if (value !== undefined) {
        if (ttlInSeconds) {
          return client.setexAsync(key, ttlInSeconds, JSON.stringify(value));
        } else {
          return client.setAsync(key, JSON.stringify(value));
        }
      }
    },
  };
};

module.exports = redisProvider;
