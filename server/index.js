require('../env');

const next = require('next');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cloudflareIps = require('cloudflare-ip/ips.json');
const throng = require('throng');

const logger = require('./logger');
const loggerMiddleware = require('./logger-middleware');
const routes = require('./routes');
const hyperwatch = require('./hyperwatch');
const rateLimiter = require('./rate-limiter');
const duplicateHandler = require('./duplicate-handler');
const { serviceLimiterMiddleware, increaseServiceLevel } = require('./service-limiter');
const { parseToBooleanDefaultFalse } = require('./utils');

const app = express();

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'].concat(cloudflareIps));

const dev = process.env.NODE_ENV === 'development';

const nextApp = next({ dev });
const nextRequestHandler = nextApp.getRequestHandler();

const port = process.env.PORT;

const workers = process.env.WEB_CONCURRENCY || 1;

const desiredServiceLevel = Number(process.env.SERVICE_LEVEL) || 100;

const start = id =>
  nextApp.prepare().then(async () => {
    logger.info(
      `Starting with NODE_ENV=${process.env.NODE_ENV} OC_ENV=${process.env.OC_ENV} API_URL=${process.env.API_URL}`,
    );

    await hyperwatch(app);

    await rateLimiter(app);

    if (parseToBooleanDefaultFalse(process.env.SERVICE_LIMITER)) {
      app.use(serviceLimiterMiddleware);
    }

    app.use(
      helmet({
        // Content security policy is generated from `_document` for compatibility with Vercel
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false, // This one turned off for loading Stripe js (at least)
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
      }),
    );

    app.use(cookieParser());

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

    routes(app);

    app.get('*', (req, res) => nextRequestHandler(req, res));

    app.use(loggerMiddleware.errorLogger);

    app.listen(port, err => {
      if (err) {
        throw err;
      }
      logger.info(`Ready on http://localhost:${port}, Worker #${id}`);

      // Wait 30 seconds before reaching service level 50 or desiredServiceLevel
      setTimeout(() => {
        increaseServiceLevel(Math.min(50, desiredServiceLevel));
      }, 30000);

      // Wait 3 minutes before reaching desiredServiceLevel
      setTimeout(() => {
        increaseServiceLevel(desiredServiceLevel);
      }, 180000);
    });
  });

if (workers && workers > 1) {
  throng({ worker: start, count: workers });
} else {
  start(1);
}
