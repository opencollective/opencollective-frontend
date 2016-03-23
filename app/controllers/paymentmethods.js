var _ = require('lodash');

module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');

  /**
   * Get the paymentMethods of the user.
   *
   * We use the method to know if the user need to confirm her/his paypal
   * account
   */
  var getPaymentMethods = function(req, res, next) {
    var filter = req.query.filter;
    var query = _.extend({}, filter, { UserId: req.user.id });

    return models.PaymentMethod.findAll({ where: query })
    .then(function(response) {
      res.send(_.pluck(response, 'info'));
    })
    .catch(next);
  };

  /**
   * Public methods.
   */
  return {
    getPaymentMethods: getPaymentMethods
  };
};
