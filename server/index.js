require('../env');

const path = require('path');

const next = require('next');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cloudflareIps = require('cloudflare-ip/ips.json');
const throng = require('throng');

const { debugPerformance } = require('./debug');
const intl = require('./intl');
const logger = require('./logger');
const loggerMiddleware = require('./logger-middleware');
const routes = require('./routes');
const { Sentry } = require('./sentry');
const hyperwatch = require('./hyperwatch');
const rateLimiter = require('./rate-limiter');
const { getContentSecurityPolicyConfig } = require('./content-security-policy');

const app = express();

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'].concat(cloudflareIps));

const dev = process.env.NODE_ENV === 'development';

const nextApp = next({ dev, dir: path.dirname(__dirname) });

const port = process.env.PORT;

const WORKERS = process.env.WEB_CONCURRENCY || 1;

const start = id =>
  nextApp.prepare().then(() => {
    app.use((req, res, next) => {
      if (
        !req.url.match(/^\/_/) &&
        !req.url.match(/^\/static/) &&
        !req.url.match(/^\/api/) &&
        !req.url.match(/^\/favicon\.ico/)
      ) {
        debugPerformance(`Request in ${req.url}`);
        res.on('finish', () => {
          debugPerformance(`Request out ${req.url}`);
        });
      }
      next();
    });

    // app.buildId is only available after app.prepare(), hence why we setup here
    app.use(Sentry.Handlers.requestHandler());

    hyperwatch(app);

    rateLimiter(app);

    app.use(helmet({ contentSecurityPolicy: getContentSecurityPolicyConfig() }));

    app.use(cookieParser());

    app.use(intl.middleware());

    app.use(routes(app, nextApp));
    app.use(Sentry.Handlers.errorHandler());
    app.use(loggerMiddleware.errorLogger);

    app.listen(port, err => {
      if (err) {
        throw err;
      }
      logger.info(`Ready on http://localhost:${port}, Worker #${id}`);
    });
  });

if (WORKERS && WORKERS > 1) {
  throng({ workers: WORKERS, lifetime: Infinity }, start);
} else {
  start(1);
}
