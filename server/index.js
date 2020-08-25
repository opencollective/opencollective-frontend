require('../env');

const path = require('path');

const next = require('next');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cloudflareIps = require('cloudflare-ip/ips.json');

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

nextApp.prepare().then(() => {
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
    logger.info(`Ready on http://localhost:${port}`);
  });
});
