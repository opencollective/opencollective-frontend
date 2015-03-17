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
 * Routes.
 */
require('./config/routes')(app);


/**
 * Sync database.
 */
models.sequelize.sync().success(start);


/**
 * Start server.
 */
function start() {
  var server = app.listen(3000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)

  });
}


/*
  var User = app.get('models').User;
  User
    .create({ first_name: "John", last_name: "Doe "})
    .complete(function(err, user) {
      console.log('err : ', err);
      console.log(user.get('first_name'));
    });

*/
