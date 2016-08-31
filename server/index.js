import './lib/load-dot-env'; // important to load first for environment config
import express from 'express';
import models from './models';
import routes from './routes';
import os from 'os';
import expressLib from './lib/express';

const app = express();

/**
 * Models.
 */

app.set('models', models);

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

export default app;
