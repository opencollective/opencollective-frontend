/**
 * Dependencies.
 */
var express = require('express')
  , app = express()
  ;

/**
 * Models.
 */
var models = require('./app/models');
app.set('models', models);

/**
 * Config.
 */
require('./app/lib/config')(app);

/**
 * Routes.
 */
require('./app/controllers/routes')(app);


if (app.set('env') === 'test') {
  return module.exports = app;
}
else {
  /**
   * Sync database.
   */
  models.sequelize.sync()
    .success(start)
    .error(function(err) {
      console.log('Error sync the db:', err);
      process.exit(1);
    });
}

/**
 * Start server.
 */
function start() {
  var port = app.set('port') || 3000;
  var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Assoc API listening at http://%s:%s in %s environment.', host, port, app.set('env'));
  });
}
