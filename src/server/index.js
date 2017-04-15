process.env.LOGS_SECRET_KEY && require('now-logs')(process.env.LOGS_SECRET_KEY)

import logger from './logger';
import { createServer } from 'http';
import next from 'next';
import routes from './routes';

const env = process.env.NODE_ENV || "development";
const dev = (env === 'development');
const app = next({ dev, dir: 'src' });
const handler = routes.getRequestHandler(app)

app.prepare()
.then(() => {
  createServer(handler)
  .listen(3000, (err) => {
    if (err) {
      logger.error("error in creating server", err);
      throw err
    }
    logger.info(`>> Ready on http://localhost:3000 in ${env} environment`);
  })
})