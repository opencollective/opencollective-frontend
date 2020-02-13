import './env';

import os from 'os';
import config from 'config';
import express from 'express';

import routes from './routes';
import expressLib from './lib/express';
import logger from './lib/logger';

const app = express();

expressLib(app);

/**
 * Routes.
 */

routes(app);

/**
 * Start server
 */
const server = app.listen(config.port, () => {
  const host = os.hostname();
  logger.info(
    'Open Collective API listening at http://%s:%s in %s environment.\n',
    host,
    server.address().port,
    config.env,
  );
  if (config.maildev.server) {
    const maildev = require('./maildev'); // eslint-disable-line @typescript-eslint/no-var-requires
    maildev.listen();
  }
});

server.timeout = 25000; // sets timeout to 25 seconds

export default app;
