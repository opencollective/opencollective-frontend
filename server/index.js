import './lib/load-dot-env'; // important to load first for environment config
import config from 'config';
import express from 'express';
import perf from 'express-perf';
import routes from './routes';
import os from 'os';
import expressLib from './lib/express';

const app = express();

// monitoring, should go first
app.use(perf(express, {
	apiKey: config.expressperf.api_key
}))

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
  console.log('OpenCollective API listening at http://%s:%s in %s environment.\n', host, server.address().port, app.set('env'));
});

server.timeout = 15000; // sets timeout to 15 seconds

export default app;
