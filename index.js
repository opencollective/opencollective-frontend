/**
 * Dependencies.
 */
import express from 'express';
import models from './server/models';
import controllers from './server/controllers';
import routes from './server/routes';
import config from './server/lib/config';
import errors from './server/lib/errors';
import os from 'os';

var NODE_ENV = process.env.NODE_ENV;
const app = express();

if (!NODE_ENV) {
  NODE_ENV = process.env.NODE_ENV = 'development';
}

require('./server/lib/load-dot-env');

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
