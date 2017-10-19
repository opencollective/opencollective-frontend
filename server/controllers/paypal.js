import config from 'config';
import moment from 'moment';
import models from '../models';
import errors from '../lib/errors';
import paypalAdaptive from '../gateways/paypalAdaptive';

const {
  Activity,
  PaymentMethod
} = models;

/**
 * Get preapproval details route
 */
export const getDetails = function(req, res, next) {
  const preapprovalKey = req.params.preapprovalkey;

  return getPreapprovalDetailsAndUpdatePaymentMethod(preapprovalKey, req.remoteUser.CollectiveId)
    .then(response => res.json(response))
    .catch(next);
};

/**
 * Get a preapproval key for a user.
 */
export const getPreapprovalKey = function(req, res, next) {

  const uri = `/users/${req.remoteUser.id}/paypal/preapproval/`;
  const baseUrl = config.host.website + uri;
  // TODO: The cancel URL doesn't work - no routes right now.
  const cancelUrl = req.query.cancelUrl || (`${baseUrl}/cancel`);
  const returnUrl = req.query.returnUrl || (`${baseUrl}/success`);
  const expiryDate = (req.query.endingDate && (new Date(req.query.endingDate))) || moment().add(1, 'years');
  
  const payload = {
    currencyCode: 'USD', // TODO: figure out if there is a reliable way to specify correct currency for a HOST.
    startingDate: new Date().toISOString(),
    endingDate: expiryDate.toISOString(),
    returnUrl,
    cancelUrl,
    displayMaxTotalAmount: false,
    feesPayer: 'SENDER',
    maxAmountPerPayment: 2000.00, // PayPal claims this can go up to $10k without needing additional permissions from them.
    maxTotalAmountOfAllPayments: 2000.00, // PayPal claims this isn't needed but Live errors out if we don't send it.
    clientDetails: req.remoteUser.id
  };

  let paymentMethod;

  return paypalAdaptive.preapproval(payload)
  .then(response => PaymentMethod.create({
    CreatedByUserId: req.remoteUser.id,
    service: 'paypal',
    CollectiveId: req.remoteUser.CollectiveId,
    token: response.preapprovalKey,
    expiryDate
  }))

  // Confirm preapprovalKey with PayPal
  .then(getPreapprovalDetailsAndUpdatePaymentMethod)
  .then(pm => {
    paymentMethod = pm;
    return Activity.create({
      type: 'user.paymentMethod.created',
      UserId: req.remoteUser.id,
      data: {
        user: req.remoteUser.minimal,
        paymentMethod: paymentMethod.minimal
      }
    });
  })
  
  // clean any old payment methods
  .then(() => PaymentMethod.findAll({
    where: {
      service: 'paypal',
      CollectiveId: req.remoteUser.CollectiveId,
      token: {$ne: req.params.preapprovalkey}
    }
  }))
  // TODO: Call paypal to cancel preapproval keys before marking as deleted.
  .then(oldPMs => oldPMs && oldPMs.map(pm => pm.destroy()))

  .then(() => res.send(paymentMethod.info))
  .catch(next);
};


/*
 * Confirms that the preapprovalKey has been approved by PayPal
 * and updates the paymentMethod
 */
const getPreapprovalDetailsAndUpdatePaymentMethod = function(paymentMethod) {

  let preapprovalDetailsResponse;
  
  return paypalAdaptive.preapprovalDetails(paymentMethod.token)
    .tap(response => preapprovalDetailsResponse = response)
    .then(response => response.approved === 'false' ? 
      Promise.reject(new errors.BadRequest('This preapprovalkey is not approved yet.')) : 
      Promise.resolve())
    .then(() => paymentMethod.update({
        confirmedAt: new Date(),
        name: preapprovalDetailsResponse.senderEmail,
        data: {
          response: preapprovalDetailsResponse,
        }
      }))
}