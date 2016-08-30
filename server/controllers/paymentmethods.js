import _ from 'lodash';

export default function(app) {

  /**
   * Internal Dependencies.
   */
  const { PaymentMethod } = app.set('models');

  /**
   * Get the paymentMethods of the user.
   *
   * We use the method to know if the user need to confirm her/his paypal
   * account
   */
  const getPaymentMethods = (req, res, next) => {
    const { filter } = req.query;
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
}
