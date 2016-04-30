/**
 * Dependencies.
 */

const express = require('express');

var NODE_ENV = process.env.NODE_ENV;
const app = express();

if (!NODE_ENV) {
  NODE_ENV = process.env.NODE_ENV = 'development';
}

require('./server/lib/load-dot-env');

app.errors = require('./server/lib/errors');

require('./server/lib/express')(app);

/**
 * Config.
 */

require('./server/lib/config')(app);

/**
 * Models.
 */

app.set('models', require('./server/models'));

/**
 * Controllers.
 */

app.set('controllers', require('./server/controllers')(app));

/**
 * Routes.
 */

require('./server/routes')(app);

/**
 * Start server
 */
const port = process.env.PORT || 3060;
const server = app.listen(port, () => {
  const host = require('os').hostname();
  console.log('OpenCollective API listening at http://%s:%s in %s environment.\n', host, server.address().port, app.set('env'));
});

module.exports = app;
