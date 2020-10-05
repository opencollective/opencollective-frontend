require('../env');

const path = require('path');

const next = require('next');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cloudflareIps = require('cloudflare-ip/ips.json');
const throng = require('throng');

const intl = require('./intl');
const logger = require('./logger');
const loggerMiddleware = require('./logger-middleware');
const routes = require('./routes');
const { Sentry } = require('./sentry');
const hyperwatch = require('./hyperwatch');
const rateLimiter = require('./rate-limiter');
const duplicateHandler = require('./duplicate-handler');
const { getContentSecurityPolicyConfig } = require('./content-security-policy');
const { parseToBooleanDefaultFalse } = require('./utils');

const app = express();

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'].concat(cloudflareIps));

const dev = process.env.NODE_ENV === 'development';

const nextApp = next({ dev, dir: path.dirname(__dirname) });

const port = process.env.PORT;

const workers = process.env.WEB_CONCURRENCY || 1;

const start = id =>
  nextApp.prepare().then(() => {
    // app.buildId is only available after app.prepare(), hence why we setup here
    app.use(Sentry.Handlers.requestHandler());

    hyperwatch(app);

    rateLimiter(app);

    app.use(helmet({ contentSecurityPolicy: getContentSecurityPolicyConfig() }));

    app.use(cookieParser());

    app.use(intl.middleware());

    if (parseToBooleanDefaultFalse(process.env.DUPLICATE_HANDLER)) {
      app.use(
        duplicateHandler({
          skip: req =>
            req.url.match(/^\/_/) ||
            req.url.match(/^\/static/) ||
            req.url.match(/^\/api/) ||
            req.url.match(/^\/favicon\.ico/),
        }),
      );
    }

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

if (workers && workers > 1) {
  throng({ worker: start, count: workers });
} else {
  start(1);
}
