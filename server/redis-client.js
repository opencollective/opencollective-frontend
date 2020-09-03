const redis = require('redis');

const redisServerUrl = process.env.REDIS_URL;

let client;
if (redisServerUrl) {
  client = redis.createClient(redisServerUrl);
}

module.exports = client;
