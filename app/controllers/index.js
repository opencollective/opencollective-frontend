module.exports = function(app) {

  /**
   * Controllers.
   */
  var cs = {};
  var controllers = [
    'activities',
    'paymentmethods',
    'groups',
    'images',
    'middlewares',
    'payments',
    'paypal',
    'notifications',
    'stripe',
    'subscriptions',
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
