/**
 * Dependencies.
 */
import './server/env' // important to load first for environment config
import express from 'express';
import models from './server/models';
import controllers from './server/controllers';
import routes from './server/routes';
import config from './server/lib/config';
import errors from './server/lib/errors';
import os from 'os';

const app = express();

app.errors = errors;

/**
 * Config.
 */

config(app);

/**
 * Models.
 */

app.set('models', models);

require('./server/lib/express')(app);

/**
 * Controllers.
 */

app.set('controllers', controllers(app));

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

module.exports = app;
