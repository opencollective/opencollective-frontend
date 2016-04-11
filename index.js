/**
 * Dependencies.
 */

const express = require('express');
const _ = require('lodash');

var NODE_ENV = process.env.NODE_ENV;
const app = express();

if (!NODE_ENV) {
  NODE_ENV = process.env.NODE_ENV = 'development';
}

if (_.contains(['test', 'development', 'test_server', 'circleci_test_server'], NODE_ENV)) {
  require('./app/lib/load-dot-env')();
}

app.errors = require('./app/lib/errors');

require('./app/lib/express')(app);

/**
 * Config.
 */

require('./app/lib/config')(app);

/**
 * Models.
 */

app.set('models', require('./app/models'));

/**
 * Controllers.
 */

app.set('controllers', require('./app/controllers')(app));

/**
 * Routes.
 */

require('./app/routes')(app);

/**
 * Start server
 */
const port = process.env.PORT || 3060;
const server = app.listen(port, () => {
  const host = require('os').hostname();
  console.log('OpenCollective API listening at http://%s:%s in %s environment.', host, server.address().port, app.set('env'));
});

module.exports = app;
