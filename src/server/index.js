process.env.LOGS_SECRET_KEY && require('now-logs')(process.env.LOGS_SECRET_KEY)

import express from 'express';
import next from 'next';
import routes from './routes';
import { loggerMiddleware, logger } from './logger';

const env = process.env.NODE_ENV || "development";
const dev = (env === 'development');
const server = express();
const app = next({ dev, dir: dev ? 'src' : 'build' });
server.next = app;

const port = process.env.PORT || 3000;

app.prepare()
.then(() => {

  server.use(loggerMiddleware.logger);

  // allow the frontend to log errors to papertrail
  server.get('/log/:type', (req, res) => {
    logger[req.params.type](req.query.message);
    res.send('ok');
  });

  server.use(routes(server));
  server.use(loggerMiddleware.errorLogger);
  server.listen(port, (err) => {
    if (err) {
      logger.error(">> Error when starting server", err);
      throw err
    }
    logger.info(`>> Ready on http://localhost:${port} in ${env} environment`);
  })
})