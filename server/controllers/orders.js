import models from '../models';
import errors from '../lib/errors';
import { executeOrder } from '../lib/payments';
import Promise from 'bluebird';

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
  let promise = Promise.resolve();

  // if donation is on someone else's behalf, find or create that user
  if (order.email && order.email !== remoteUser.email) {
    promise = models.User.findOrCreateByEmail(order.email, models.User.splitName(order.name))
    .tap(u => user = u)
  } else {
    // if the donation is from the host, we need to add the funds first to the Host Collective
    promise = models.Transaction.create({
      type: 'CREDIT',
      CreatedByUserId: req.remoteUser.id,
      CollectiveId: req.remoteUser.CollectiveId,
      HostCollectiveId: req.remoteUser.CollectiveId,
      FromCollectiveId: null, // money doesn't come from a collective but from an external source (Host's bank account)
      currency: collective.currency,
      netAmountInCollectiveCurrency: totalAmount,
      amountInHostCurrency: totalAmount,
      hostFeeInTxnCurrency: null,
      description
    })
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