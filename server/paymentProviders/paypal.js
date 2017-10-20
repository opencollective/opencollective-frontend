import config from 'config';
import models from '../models';
import errors from '../lib/errors';
import paypalAdaptive from '../gateways/paypalAdaptive';
import moment from 'moment';

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

export default {
  features: {
    recurring: false
  },

  oauth: {
    redirectUrl: (remoteUser, CollectiveId, options = {}) => {
  
      // TODO: The cancel URL doesn't work - no routes right now.
      const { cancelUrl, returnUrl} = options;
      if (!cancelUrl || !returnUrl) {
        throw new Error("Please provide a cancelUrl and returnUrl");
      }
      const expiryDate = moment().add(1, 'years');
      
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
        clientDetails: CollectiveId
      };
    
      let response;
    
      return paypalAdaptive.preapproval(payload)
        .tap(r => response = r)
        .then(response => models.PaymentMethod.create({
          CreatedByUserId: remoteUser.id,
          service: 'paypal',
          CollectiveId: remoteUser.CollectiveId,
          token: response.preapprovalKey,
          expiryDate
        }))
        .then(() => response.preapprovalUrl);
    },

    callback: (req, res, next) => {
      return models.PaymentMethod.findOne({
        where: {
          service: 'paypal',
          CollectiveId: req.remoteUser.CollectiveId,
          token: req.params.preapprovalkey
        }})
        .then(getPreapprovalDetailsAndUpdatePaymentMethod)
        .then(pm => {
          paymentMethod = pm;
          return models.Activity.create({
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
    },

    /**
    * Get preapproval key details
    */
    verify: (req, res, next) => {
      const preapprovalKey = req.params.preapprovalkey;
      return getPreapprovalDetailsAndUpdatePaymentMethod(preapprovalKey, req.remoteUser.CollectiveId)
        .then(response => res.json(response))
        .catch(next);
    }
  }
}