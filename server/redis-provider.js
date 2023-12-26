const logger = require('./logger');
const { createRedisClient } = require('./redis');

const redisProvider = async () => {
  const redisClient = await createRedisClient();
  if (!redisClient) {
    logger.warn(`redis client not available, redisProvider in compatibility mode`);
  }

  return {
    clear: async () => redisClient?.flushAll(),
    delete: async key => redisClient?.del(key),
    get: async (key, { unserialize = JSON.parse } = {}) => {
      const value = await redisClient?.get(key);
      if (value) {
        try {
          return unserialize(value);
        } catch (err) {
          logger.error(`redisProvider: Invalid JSON`);
          logger.error(value);
        }
      } else {
        return undefined;
      }
    },
    has: async key => {
      const value = await redisClient?.get(key);
      return value !== null;
    },
    set: async (key, value, expirationInSeconds, { serialize = JSON.stringify } = {}) => {
      if (value !== undefined) {
        if (expirationInSeconds) {
          return redisClient?.set(key, serialize(value), { EX: expirationInSeconds });
        } else {
          return redisClient?.set(key, serialize(value));
        }
      }
    },
  };
};

module.exports = redisProvider;
