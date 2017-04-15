process.env.LOGS_SECRET_KEY && require('now-logs')(process.env.LOGS_SECRET_KEY)

import express from 'express';
import next from 'next';
import routes from './routes';
import { loggerMiddleware, logger } from './logger';

const env = process.env.NODE_ENV || "development";
const dev = (env === 'development');
const server = express();
const app = next({ dev, dir: dev ? 'src' : 'build' });
const handler = routes.getRequestHandler(app);

app.prepare()
.then(() => {

  server.use(loggerMiddleware.logger);
  server.use(handler)
  server.use(loggerMiddleware.errorLogger);
  server.listen(3000, (err) => {
    if (err) {
      logger.error(">> Error when starting server", err);
      throw err
    }
    logger.info(`>> Ready on http://localhost:3000 in ${env} environment`);
  })
})