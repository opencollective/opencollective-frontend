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

  // Note we can't use findOrCreate() method in Sequelize because of
  // https://github.com/sequelize/sequelize/issues/4631
  const getOrCreatePaymentMethod = (params) => {
    const token = params.token;
    const service = params.service;
    const UserId = params.UserId;

    return PaymentMethod.findOne({
        where: {
          token,
          service,
          UserId: UserId
        }
      })
      .then(paymentMethod => {
        if (!paymentMethod) {
          return PaymentMethod.create({
            token,
            service,
            UserId
          });
        } else {
          return paymentMethod;
        }
      })
    };
  /**
   * Public methods.
   */
  return {
    getPaymentMethods,
    getOrCreatePaymentMethod
  };
};
