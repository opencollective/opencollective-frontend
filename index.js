/**
 * Dependencies.
 */
var _ = require('lodash');
var express = require('express');
var app = express();

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
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
var models = require('./app/models');
app.set('models', models);

/**
 * Controllers.
 */
app.set('controllers', require('./app/controllers')(app));

/**
 * Routes.
 */
require('./app/controllers/routes')(app);

if (!_.contains(['test', 'circleci'], app.set('env'))) {
  /**
   * Start server
   */
 var port = process.env.PORT || 3060;
  var server = app.listen(port, function () {
    var host = require('os').hostname();
    var port = server.address().port;
    console.log('OpenCollective API listening at http://%s:%s in %s environment.', host, port, app.set('env'));
  });
}

module.exports = app;