const _ = require('lodash');

module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  const PaymentMethod = app.set('models').PaymentMethod;

  /**
   * Get the paymentMethods of the user.
   *
   * We use the method to know if the user need to confirm her/his paypal
   * account
   */
  const getPaymentMethods = (req, res, next) => {
    const filter = req.query.filter;
    const query = _.extend({}, filter, { UserId: req.user.id });

    return PaymentMethod.findAll({ where: query })
    .then((response) => {
      res.send(_.pluck(response, 'info'));
    })
    .catch(next);
  };

  /**
   * Public methods.
   */
  return {
    getPaymentMethods
  };
};
