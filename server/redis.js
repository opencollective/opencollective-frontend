const { createClient } = require('redis');

const logger = require('./logger');

let redisClient;

async function createRedisClient() {
  if (!redisClient) {
    const url = process.env.REDIS_URL;
    if (!url) {
      return;
    }

    const redisOptions = { url };
    if (redisOptions.url.includes('rediss://')) {
      redisOptions.socket = { tls: true, rejectUnauthorized: false };
    }

    redisClient = createClient(redisOptions);
    try {
      redisClient.on('error', err => logger.error(`Redis error`, err));
      redisClient.on('reconnecting', () => logger.info(`Redis reconnecting`));
      redisClient.on('connect', () => logger.info(`Redis connected`));
      redisClient.on('ready', () => logger.info(`Redis ready`));
      redisClient.on('end', () => logger.info(`Redis connection closed`));

      await redisClient.connect();
    } catch (err) {
      logger.error(`Redis connection error`, err);
      redisClient = null;
    }
  }

  return redisClient;
}

module.exports = {
  createRedisClient,
};
