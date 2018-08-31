import './lib/load-dot-env'; // important to load first for environment config

import 'newrelic';
import 'babel-polyfill';
import express from 'express';
import routes from './routes';
import os from 'os';
import expressLib from './lib/express';
import backgroundJobs from './background-jobs';

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
  console.log('Open Collective API listening at http://%s:%s in %s environment.\n', host, server.address().port, app.set('env'));
});

server.timeout = 25000; // sets timeout to 25 seconds

/**
 * Start background jobs
 */
backgroundJobs();

export default app;
