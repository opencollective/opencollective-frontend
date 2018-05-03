import _ from 'lodash';
import models, { Op } from '../models';

const { PaymentMethod } = models;

/**
 * Get the paymentMethods of the user.
 *
 * We use the method to know if the user need to confirm her/his paypal
 * account
 */
export default function getPaymentMethods(req, res, next) {
  const { filter } = req.query;
  const query = _.extend({}, filter, { CollectiveId: req.user.CollectiveId, confirmedAt: {[Op.ne]: null} });

  return PaymentMethod.findAll({ where: query })
  .then((response) => {
    res.send(_.pluck(response, 'info'));
  })
  .catch(next);
}
