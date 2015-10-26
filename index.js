/**
 * Dependencies.
 */
var _ = require('lodash');
var express = require('express');
var app = express();

app.errors = require('./app/lib/errors');
require('./app/lib/express')(app);

/**
 * Load env from .env file for development and test
 */
require('./app/lib/load-env')();

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
 * Config.
 */
require('./app/lib/config')(app);

/**
 * Routes.
 */
require('./app/controllers/routes')(app);

if (_.contains(['test', 'circleci'], app.set('env'))) {
  return module.exports = app;
} else {
  /**
   * Sync database.
   */
  models.sequelize.sync()
    .then(start)
    .catch(function(err) {
      console.log('Error sync the db:', err);
      process.exit(1);
    });
}

/**
 * Start server.
 */
function start() {
  var port = process.env.PORT || 3060;
  var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Assoc API listening at http://%s:%s in %s environment.', host, port, app.set('env'));
  });
}
