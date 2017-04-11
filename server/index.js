import './lib/load-dot-env'; // important to load first for environment config
import config from 'config';
import express from 'express';
import routes from './routes';
import os from 'os';
import expressLib from './lib/express';

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
  console.log('OpenCollective API listening at http://%s:%s in %s environment.\n', host, server.address().port, app.set('env'));
});

server.timeout = 15000; // sets timeout to 15 seconds

export default app;
