module.exports = function(app) {

  /**
   * Controllers.
   */
  var cs = {};
  var controllers = [
    'activities',
    'cards',
    'groups',
    'images',
    'middlewares',
    'params',
    'payments',
    'paypal',
    'subscriptions',
    'stripe',
    'transactions',
    'users',
    'webhooks',
    'test'
  ];

  /**
   * Exports.
   */
  controllers.forEach(function(controller) {
    cs[controller] = require(__dirname + '/' + controller)(app);
  });

  return cs;

};
