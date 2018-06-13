// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Only load newrelic when we explicitly want it
if (process.env.NEW_RELIC_ENABLED) {
  require('newrelic');
}

import path from 'path';
import http from 'http';
import express from 'express';
import next from 'next';
import routes from './routes';
import { loggerMiddleware, logger } from './logger';
import accepts from 'accepts';
import { getLocaleDataScript, getMessages, languages } from './intl';

const env = process.env.NODE_ENV || "development";
const dev = (env === 'development' || env === 'docker');
const server = express();
const app = next({ dev, dir: path.dirname(__dirname) });
server.next = app;

const port = process.env.PORT || 3000;

app.prepare()
.then(() => {

  server.use(loggerMiddleware.logger);

  server.use((req, res, next) => {
    const accept = accepts(req)
    const locale = accept.language(languages)  || 'en';
    logger.debug("url %s locale %s", req.url, locale);
    req.locale = locale;
    req.localeDataScript = getLocaleDataScript(locale)
    req.messages = getMessages(locale)
    // req.messages = dev ? {} : getMessages(locale)
    next();
  });

  server.use(routes(server, app));
  server.use(loggerMiddleware.errorLogger);

  const httpServer = http.createServer(server);

  httpServer.on('error', err => {
    logger.error(`Can't start server on http://localhost:${port} in ${env} environment. %s`, err);
  })

  httpServer.listen(port, () => {
    logger.info(`Ready on http://localhost:${port} in ${env} environment`);
  });

});
