import models from '../models';
import errors from '../lib/errors';
import paypalAdaptive from '../gateways/paypalAdaptive';
import moment from 'moment';
import config from 'config';
import uuid from 'node-uuid';
import { convertToCurrency } from '../lib/currency';
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

  if (!paymentMethod) {
    return Promise.reject(new Error("No payment method provided to getPreapprovalDetailsAndUpdatePaymentMethod"))
  }

  let preapprovalDetailsResponse;
  
  return paypalAdaptive.preapprovalDetails(paymentMethod.token)
    .tap(response => preapprovalDetailsResponse = response)
    .then(response => {
      if (response.approved === 'false') {
        throw new errors.BadRequest('This preapprovalkey is not approved yet.') 
      }
    })
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

  fees: async ({ amount, currency, host }) => {
    if (host.currency === currency)
      return (0.029 * amount + 30);
    else {
      return (0.05 * amount + 30);
    }
  },

  pay: (collective, expense, email, preapprovalKey) => {
    const uri = `/collectives/${collective.id}/expenses/${expense.id}/paykey/`;
    const baseUrl = config.host.webapp + uri;
    const amount = expense.amount/100;
    let createPaymentResponse;
    const payload = {
      // Note: if we change this to 'PAY', payment will complete in one step
      // but we won't get any info on fees or conversion rates.
      // By creating payment, we get that info in the first response.
      actionType: 'CREATE',
      // TODO does PayPal accept all the currencies that we support in our expenses?
      currencyCode: expense.currency,
      feesPayer: 'SENDER',
      memo: `Reimbursement from ${collective.name}: ${expense.description}`,
      trackingId: [uuid.v1().substr(0, 8), expense.id].join(':'),
      preapprovalKey,
      returnUrl: `${baseUrl}/success`,
      cancelUrl: `${baseUrl}/cancel`,
      receiverList: {
        receiver: [
          {
            email,
            amount,
            paymentType: 'SERVICE'
          }
        ]
      }
    };

    return paypalAdaptive.pay(payload)
      .tap(payResponse => createPaymentResponse = payResponse)
      .then(payResponse => paypalAdaptive.executePayment(payResponse.payKey))
      .then(executePaymentResponse => {
        return { createPaymentResponse, executePaymentResponse}
      });
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
      return 200000 + totalSpent; // total spent has a negative value (in cents)
    })
  },

  oauth: {
    redirectUrl: (remoteUser, CollectiveId, options = {}) => {
  
      // TODO: The cancel URL doesn't work - no routes right now.
      const { redirect } = options;
      if (!redirect) {
        throw new Error("Please provide a redirect url as a query parameter (?redirect=)");
      }
      const expiryDate = moment().add(1, 'years');

      let response;

      return models.Collective.findById(CollectiveId)
      .then(collective => {
          return convertToCurrency(2000, 'USD', collective.currency)
            .then(limit => {
              // We can request a paykey for up to $2,000 equivalent (minus 5%)
              const lowerLimit = collective.currency === 'USD' ? 2000 : Math.floor(0.95 * limit);
              console.log(">>> requesting a paykey for ", formatCurrency(lowerLimit*100, collective.currency));
              return {
                currencyCode: collective.currency,
                startingDate: new Date().toISOString(),
                endingDate: expiryDate.toISOString(),
                returnUrl: `${config.host.api}/connected-accounts/paypal/callback?paypalApprovalStatus=success&preapprovalKey=\${preapprovalKey}`,
                cancelUrl: `${config.host.api}/connected-accounts/paypal/callback?paypalApprovalStatus=error&preapprovalKey=\${preapprovalKey}`,
                displayMaxTotalAmount: false,
                feesPayer: 'SENDER',
                maxAmountPerPayment: lowerLimit, // PayPal claims this can go up to $10k without needing additional permissions from them.
                maxTotalAmountOfAllPayments: lowerLimit, // PayPal claims this isn't needed but Live errors out if we don't send it.
                clientDetails: CollectiveId
              };
            });
        })
        .then(payload => paypalAdaptive.preapproval(payload))
        .then(r => response = r)
        .then(() => models.PaymentMethod.create({
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
          return next(new errors.BadRequest(`No paymentMethod found with this preapproval key: ${req.query.preapprovalKey}`));
        }

        if (req.query.paypalApprovalStatus !== 'success') {
          pm.destroy();
          const redirect = `${paymentMethod.data.redirect}?status=error&service=paypal&error=User%20cancelled%20the%20request`;
          return res.redirect(redirect);
        }

        return getPreapprovalDetailsAndUpdatePaymentMethod(pm)
          .catch(e => {
            console.error(">>> paypal callback error:", e);
            const redirect = `${paymentMethod.data.redirect}?status=error&service=paypal&error=Error%20while%20contacting%20PayPal&errorMessage=${encodeURIComponent(e.message)}`;
            console.log(">>> redirect", redirect);
            res.redirect(redirect);
            throw e; // make sure we skip what follows until next catch()
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
      })
      .catch(next);
    },

    /**
    * Get preapproval key details
    */
    verify: (req, res, next) => {
      return models.PaymentMethod.findOne({
          where: {
            service: 'paypal',
            token: req.query.preapprovalKey
          },
          order: [['createdAt', 'DESC']]
        })
        .then(pm => {
          if (!pm) {
            return next(new errors.BadRequest(`No paymentMethod found with this preapproval key: ${req.query.preapprovalKey}`));
          }
          if (!req.remoteUser.isAdmin(pm.CollectiveId)) {
            return next(new errors.Unauthorized("You are not authorized to verify a payment method of a collective that you are not an admin of"));
          }
          return getPreapprovalDetailsAndUpdatePaymentMethod(pm).then(pm => res.json(pm.info));
        })
        .catch(next);
    }
  }
}