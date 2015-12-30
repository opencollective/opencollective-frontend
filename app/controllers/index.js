module.exports = function(app) {

  /**
   * Controllers.
   */
  var cs = {};
  var controllers = [
    'activities',
    'auth',
    'cards',
    'groups',
    'images',
    'middlewares',
    'params',
    'payments',
    'paypal',
    'subscriptions',
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
