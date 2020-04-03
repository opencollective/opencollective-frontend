require('../env');

const http = require('http');
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

const server = express();

server.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'].concat(cloudflareIps));

const env = process.env.NODE_ENV;
const dev = env === 'development';

const app = next({ dev, dir: path.dirname(__dirname) });

const port = process.env.PORT;

app.prepare().then(() => {
  // app.buildId is only available after app.prepare(), hence why we setup here
  server.use(Sentry.Handlers.requestHandler());

  server.use(loggerMiddleware.logger);

  server.use(helmet());

  server.use(cookieParser());

  server.use(intl.middleware());

  server.use(routes(server, app));
  server.use(Sentry.Handlers.errorHandler());
  server.use(loggerMiddleware.errorLogger);

  const httpServer = http.createServer(server);

  httpServer.on('error', err => {
    logger.error(`Can't start server on http://localhost:${port} in ${env} environment. %s`, err);
  });

  httpServer.listen(port, () => {
    logger.info(`Ready on http://localhost:${port} in ${env} environment`);
  });
});
