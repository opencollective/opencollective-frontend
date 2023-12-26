// This is a quick port of https://github.com/ded/express-limiter to async Redis

function expressLimiter(redisClient) {
  return function (opts) {
    let middleware = async function (req, res, next) {
      if (opts.whitelist && opts.whitelist(req)) {
        return next();
      }
      opts.lookup = Array.isArray(opts.lookup) ? opts.lookup : [opts.lookup];
      opts.onRateLimited =
        typeof opts.onRateLimited === 'function'
          ? opts.onRateLimited
          : function (req, res) {
              res.status(429).send('Rate limit exceeded');
            };
      const lookups = opts.lookup
        .map(item => {
          return `${item}:${item.split('.').reduce((prev, cur) => {
            return prev[cur];
          }, req)}`;
        })
        .join(':');
      const path = opts.path || req.path;
      const method = (opts.method || req.method).toLowerCase();
      const key = `ratelimit:${path}:${method}:${lookups}`;
      let limit;
      try {
        limit = await redisClient.get(key);
      } catch (err) {
        // Nothing
      }
      const now = Date.now();
      limit = limit
        ? JSON.parse(limit)
        : {
            total: opts.total,
            remaining: opts.total,
            reset: now + opts.expire,
          };

      if (now > limit.reset) {
        limit.reset = now + opts.expire;
        limit.remaining = opts.total;
      }

      // do not allow negative remaining
      limit.remaining = Math.max(Number(limit.remaining) - 1, -1);
      try {
        await redisClient.set(key, JSON.stringify(limit), { PX: opts.expire });
      } catch (err) {
        // Nothing
      }
      if (!opts.skipHeaders) {
        res.set('X-RateLimit-Limit', limit.total);
        res.set('X-RateLimit-Reset', Math.ceil(limit.reset / 1000)); // UTC epoch seconds
        res.set('X-RateLimit-Remaining', Math.max(limit.remaining, 0));
      }

      if (limit.remaining >= 0) {
        return next();
      }

      const after = (limit.reset - Date.now()) / 1000;

      if (!opts.skipHeaders) {
        res.set('Retry-After', after);
      }

      opts.onRateLimited(req, res, next);
    };

    if (typeof opts.lookup === 'function') {
      const callableLookup = opts.lookup;
      middleware = function (middleware, req, res, next) {
        return callableLookup(req, res, opts, () => {
          return middleware(req, res, next);
        });
      }.bind(this, middleware);
    }

    return middleware;
  };
}

module.exports = expressLimiter;
