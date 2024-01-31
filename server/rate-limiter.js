const expressLimiter = require('./express-limiter');
const logger = require('./logger');
const { parseToBooleanDefaultFalse } = require('./utils');
const { createRedisClient } = require('./redis');

const enabled = parseToBooleanDefaultFalse(process.env.RATE_LIMITING_ENABLED);
const simulate = parseToBooleanDefaultFalse(process.env.RATE_LIMITING_SIMULATE);

// Default: 20 requests / 60 seconds
const total = Number(process.env.RATE_LIMITING_TOTAL) || 20;
const expire = Number(process.env.RATE_LIMITING_EXPIRE) || 60;

const load = async app => {
  if (!enabled) {
    return;
  }

  const redisClient = await createRedisClient();
  if (!redisClient) {
    logger.warn(`redisClient not available, rate-limiter disabled`);
    return;
  }

  const whitelist = req =>
    req.url.match(/^\/_/) || req.url.match(/^\/static/) || req.url.match(/^\/api/) || req.url.match(/^\/favicon\.ico/)
      ? true
      : false;

  const lookup = async (req, res, opts, next) => {
    if (!whitelist(req)) {
      if (!req.identityOrIp && req.hyperwatch) {
        req.identityOrIp = await req.hyperwatch.getIdentityOrIp();
      }
      if (req.identityOrIp) {
        opts.lookup = 'identityOrIp';
      } else {
        opts.lookup = 'ip';
      }
    }
    return next();
  };

  const onRateLimited = (req, res, next) => {
    logger.info(`Rate limit exceeded for '${req.ip}' '${req.headers['user-agent']}'`);
    if (simulate) {
      next();
      return;
    }
    const message = `Rate limit exceeded. Try again in a few seconds. Please contact support@doohicollective.org if you think this is an error.`;
    res.status(429).send(message);
  };

  const expressLimiterOptions = {
    path: '*',
    method: 'all',
    total: total,
    expire: expire * 1000,
    whitelist,
    lookup,
    onRateLimited,
  };

  app.use(expressLimiter(redisClient)(expressLimiterOptions));
};

module.exports = load;
