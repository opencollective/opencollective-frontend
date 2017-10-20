import models from '../models';
import errors from '../lib/errors';
import paypalAdaptive from '../gateways/paypalAdaptive';
import moment from 'moment';
import config from 'config';
import { formatCurrency } from '../lib/utils';
import debugLib from 'debug';
const debug = debugLib('paypal');

/**
 * PayPal paymentProvider
 * Provides a oAuth flow to creates a payment method that can be used to pay up to $2,000 USD or equivalent
 */

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
          ...paymentMethod.data,
          response: preapprovalDetailsResponse,
        }
      })
    )
    .catch(e => {
      console.log(">>> getPreapprovalDetailsAndUpdatePaymentMethod error ", e);
      throw e;
    })
}

export default {
  features: {
    recurring: false,
    paymentMethod: true // creates a payment method that can be used to pay up to $2,000 USD or equivalent
  },

  // Returns the balance in the currency of the paymentMethod
  getBalance: (paymentMethod) => {
    let totalSpent = 0, totalTransactions = 0, firstTransactionAt, lastTransactionAt;
    return models.Transaction.findAll({
      attributes: [
        'amountInHostCurrency', 'paymentProcessorFeeInHostCurrency', 'platformFeeInHostCurrency', 'hostFeeInHostCurrency'
      ],
      where: {
        type: 'DEBIT',
        PaymentMethodId: paymentMethod.id
      }
    }).map(t => {
      totalTransactions++;
      if (!firstTransactionAt) {
        firstTransactionAt = t.createdAt;
      }
      lastTransactionAt = t.createdAt;
      totalSpent += t.netAmountInHostCurrency;
    })
    .then(() => {
      debug(`Total spent: ${formatCurrency(totalSpent, paymentMethod.currency)} across ${totalTransactions} transactions between ${firstTransactionAt} and ${lastTransactionAt}`);
      return 2000 + totalSpent; // total spent has a negative value
    })
  },

  oauth: {
    redirectUrl: (remoteUser, CollectiveId, options = {}) => {
  
      // TODO: The cancel URL doesn't work - no routes right now.
      const { redirect } = options;
      if (!redirect) {
        throw new Error("Please provide a redirect url");
      }
      const expiryDate = moment().add(1, 'years');
      
      const payload = {
        currencyCode: 'USD', // TODO: figure out if there is a reliable way to specify correct currency for a HOST.
        startingDate: new Date().toISOString(),
        endingDate: expiryDate.toISOString(),
        returnUrl: `${config.host.api}/connected-accounts/paypal/callback?paypalApprovalStatus=success&preapprovalKey=\${preapprovalKey}`,
        cancelUrl: `${config.host.api}/connected-accounts/paypal/callback?paypalApprovalStatus=error&preapprovalKey=\${preapprovalKey}`,
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
          CollectiveId,
          token: response.preapprovalKey,
          data: {
            redirect
          },
          expiryDate
        }))
        .then(() => response.preapprovalUrl);
    },

    callback: (req, res, next) => {
      let paymentMethod;
      return models.PaymentMethod.findOne({
        where: {
          service: 'paypal',
          token: req.query.preapprovalKey
        },
        order: [['createdAt', 'DESC']]
      })
      .then(pm => {
        paymentMethod = pm;
        if (!pm) {
          return next(new errors.BadRequest(`No paymentMethod found with this preapproval key: ${req.query.preapprovalKey}`))
        }
        if (req.query.paypalApprovalStatus !== 'success') {
          pm.destroy();
          const redirect = `${paymentMethod.data.redirect}?status=error&service=paypal&error=User%20cancelled%20the%20request`;
          return res.redirect(redirect);
        }
        return getPreapprovalDetailsAndUpdatePaymentMethod(pm);
      })
      .catch(e => {
        console.error(">>> paypal callback error:", e);
        const redirect = `${paymentMethod.data.redirect}?status=error&service=paypal&error=Error%20while%20contacting%20PayPal`;
        return res.redirect(redirect)
      })
      .then(pm => {
        return models.Activity.create({
          type: 'user.paymentMethod.created',
          UserId: paymentMethod.CreatedByUserId,
          CollectiveId: paymentMethod.CollectiveId,
          data: {
            paymentMethod: pm.minimal
          }
        });
      })

      // clean any old payment methods attached to this host collective
      .then(() => models.PaymentMethod.findAll({
        where: {
          service: 'paypal',
          CollectiveId: paymentMethod.CollectiveId,
          token: { $ne: req.query.preapprovalkey }
        }
      }))
      // TODO: Call paypal to cancel preapproval keys before marking as deleted.
      .then(oldPMs => oldPMs && oldPMs.map(pm => pm.destroy()))
    
      .then(() => {
        const redirect = `${paymentMethod.data.redirect}?status=success&service=paypal`;
        return res.redirect(redirect)
      })
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