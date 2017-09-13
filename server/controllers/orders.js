import models from '../models';
import errors from '../lib/errors';
import { executeOrder } from '../lib/payments';
import Promise from 'bluebird';

/**
 * Create a manual donation
 */
export const manual = (req, res, next) => {
  const { order } = req.required;
  const { remoteUser } = req;
  const { collective } = req;
  const { totalAmount, description, privateMessage } = order;

  if (!totalAmount || totalAmount < 0) {
    return Promise.reject(new Error('totalAmount must be greater than 0'));
  }

  let user = remoteUser;
  let promise = Promise.resolve();

  // if donation is on someone else's behalf, find or create that user
  if (order.email && order.email !== remoteUser.email) {
    promise = models.User.findOrCreateByEmail(order.email, models.User.splitName(order.name))
    .tap(u => user = u)
  }

  return promise
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