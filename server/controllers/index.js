module.exports = function(app) {

  /**
   * Controllers.
   */
  var cs = {};
  var controllers = [
    'activities',
    'donations',
    'expenses',
    'paymentmethods',
    'groups',
    'images',
    'middlewares',
    'paypal',
    'profile',
    'notifications',
    'stripe',
    'subscriptions',
    'transactions',
    'users',
    'webhooks',
    'test',
    'connectedAccounts'
  ];

  /**
   * Exports.
   */
  controllers.forEach((controller) => {
    cs[controller] = require(`${__dirname}/${controller}`)(app);
  });

  return cs;

};
