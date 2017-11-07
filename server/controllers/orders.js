import models from '../models';
import errors from '../lib/errors';
import { executeOrder } from '../lib/payments';

/**
 * Create a manual donation (add funds)
 * req.remoteUser must have role HOST (ensured by the middleware in the route definition)
 */
export const manual = (req, res, next) => {
  const { order } = req.required;
  const { remoteUser } = req;
  const { collective } = req;
  const { totalAmount, description, privateMessage } = order;

  if (!totalAmount || totalAmount < 0) {
    return next(new Error('totalAmount must be greater than 0'));
  }

  let user = remoteUser;

  if (!order.email) {
    order.email = remoteUser.email;
  }

  return models.User.findOrCreateByEmail(order.email, models.User.splitName(order.name))
    .then(u => user = u)
    .then(() => models.Order.create({
      CreatedByUserId: req.remoteUser.id,
      FromCollectiveId: user.CollectiveId,
      CollectiveId: collective.id,
      currency: collective.currency,
      totalAmount,
      description,
      privateMessage
    }))
    .then(order => executeOrder(user, order))
    .then(() => res.send({success: true}))
    .catch(err => next(new errors.BadRequest(err.message)));
};