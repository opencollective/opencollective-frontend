import './env'; // important to load first for environment config

import os from 'os';
import config from 'config';
import express from 'express';

import routes from './routes';
import backgroundJobs from './background-jobs';
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
const port = process.env.PORT || 3060;
const server = app.listen(port, () => {
  const host = os.hostname();
  logger.info(
    'Open Collective API listening at http://%s:%s in %s environment.\n',
    host,
    server.address().port,
    config.env,
  );
});

server.timeout = 25000; // sets timeout to 25 seconds

/**
 * Start background jobs
 */
backgroundJobs();

export default app;
