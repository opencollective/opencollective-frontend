import _ from 'lodash';
import models from '../models';

const { PaymentMethod } = models;

/**
 * Get the paymentMethods of the user.
 *
 * We use the method to know if the user need to confirm her/his paypal
 * account
 */
export default function getPaymentMethods(req, res, next) {
  const { filter } = req.query;
  const query = _.extend({}, filter, { UserId: req.user.id, confirmedAt: {$ne: null} });

  return PaymentMethod.findAll({ where: query })
  .then((response) => {
    res.send(_.pluck(response, 'info'));
  })
  .catch(next);
}
