module.exports = function(app) {

  /**
   * Controllers.
   */
  var cs = {};
  var controllers = [
    'activities',
    'auth',
    'groups',
    'images',
    'middlewares',
    'params',
    'payments',
    'transactions',
    'users'
  ];

  /**
   * Exports.
   */
  controllers.forEach(function(controller) {
    cs[controller] = require(__dirname + '/' + controller)(app);
  });

  return cs;

};
