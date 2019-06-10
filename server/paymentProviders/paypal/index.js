import debug from 'debug';
import config from 'config';
import moment from 'moment';

import models, { Op } from '../../models';
import errors from '../../lib/errors';
import paypalAdaptive from './adaptiveGateway';
import { convertToCurrency } from '../../lib/currency';
import { formatCurrency } from '../../lib/utils';
import adaptive from './adaptive';
import payment from './payment';
import { get } from 'lodash';

const debugPaypal = debug('paypal');

/**
 * PayPal paymentProvider
 * Provides a oAuth flow to creates a payment method that can be used to pay up to $2,000 USD or equivalent
 */

/*
 * Confirms that the preapprovalKey has been approved by PayPal
 * and updates the paymentMethod
 */
const getPreapprovalDetailsAndUpdatePaymentMethod = async function(paymentMethod) {
  if (!paymentMethod) {
    return Promise.reject(new Error('No payment method provided to getPreapprovalDetailsAndUpdatePaymentMethod'));
  }

  const response = await paypalAdaptive.preapprovalDetails(paymentMethod.token);
  if (response.approved === 'false') {
    throw new errors.BadRequest('This preapprovalkey is not approved yet.');
  }

  const data = {
    redirect: paymentMethod.data.redirect,
    details: response,
    balance: (parseFloat(response.maxTotalAmountOfAllPayments) - parseFloat(response.curPaymentsAmount)) * 100,
    currency: response.currencyCode,
    transactionsCount: response.curPayments,
  };

  return paymentMethod.update({
    confirmedAt: new Date(),
    name: response.senderEmail,
    data,
  });
};

export default {
  types: {
    default: adaptive,
    adaptive,
    payment,
  },

  oauth: {
    redirectUrl: (remoteUser, CollectiveId, options = {}) => {
      // TODO: The cancel URL doesn't work - no routes right now.
      const { redirect } = options;
      if (!redirect) {
        throw new Error('Please provide a redirect url as a query parameter (?redirect=)');
      }
      const expiryDate = moment().add(1, 'years');

      let collective, response;

      return models.Collective.findByPk(CollectiveId)
        .then(c => {
          collective = c;
          return convertToCurrency(2000, 'USD', collective.currency).then(limit => {
            // We can request a paykey for up to $2,000 equivalent (minus 5%)
            const lowerLimit = collective.currency === 'USD' ? 2000 : Math.floor(0.95 * limit);
            debugPaypal('>>> requesting a paykey for ', formatCurrency(lowerLimit * 100, collective.currency));
            return {
              currencyCode: 'USD', // collective.currency, // we should use the currency of the host collective but still waiting on PayPal to resolve that issue.
              startingDate: new Date().toISOString(),
              endingDate: expiryDate.toISOString(),
              returnUrl: `${config.host.api}/connected-accounts/paypal/callback?paypalApprovalStatus=success&preapprovalKey=\${preapprovalKey}`,
              cancelUrl: `${config.host.api}/connected-accounts/paypal/callback?paypalApprovalStatus=error&preapprovalKey=\${preapprovalKey}`,
              displayMaxTotalAmount: false,
              feesPayer: 'SENDER',
              maxAmountPerPayment: 2000.0, // lowerLimit, // PayPal claims this can go up to $10k without needing additional permissions from them.
              maxTotalAmountOfAllPayments: 2000.0, // , // PayPal claims this isn't needed but Live errors out if we don't send it.
              clientDetails: CollectiveId,
            };
          });
        })
        .then(payload => paypalAdaptive.preapproval(payload))
        .then(r => (response = r))
        .then(() =>
          models.PaymentMethod.create({
            CreatedByUserId: remoteUser.id,
            currency: collective.currency,
            service: 'paypal',
            type: 'adaptive',
            CollectiveId,
            token: response.preapprovalKey,
            data: {
              redirect,
            },
            expiryDate,
          }),
        )
        .then(() => response.preapprovalUrl);
    },

    callback: (req, res, next) => {
      let paymentMethod;
      return models.PaymentMethod.findOne({
        where: {
          service: 'paypal',
          type: 'adaptive',
          token: req.query.preapprovalKey,
        },
        order: [['createdAt', 'DESC']],
      })
        .then(pm => {
          paymentMethod = pm;

          if (!pm) {
            return next(
              new errors.BadRequest(`No paymentMethod found with this preapproval key: ${req.query.preapprovalKey}`),
            );
          }

          if (req.query.paypalApprovalStatus !== 'success') {
            pm.destroy();
            const redirect = `${paymentMethod.data.redirect}?status=error&service=paypal&error=User%20cancelled%20the%20request`;
            return res.redirect(redirect);
          }

          return (
            getPreapprovalDetailsAndUpdatePaymentMethod(pm)
              .catch(e => {
                debugPaypal('>>> paypal callback error:', e);
                const redirect = `${
                  paymentMethod.data.redirect
                }?status=error&service=paypal&error=Error%20while%20contacting%20PayPal&errorMessage=${encodeURIComponent(
                  e.message,
                )}`;
                debugPaypal('>>> redirect', redirect);
                res.redirect(redirect);
                throw e; // make sure we skip what follows until next catch()
              })
              .then(pm => {
                return models.Activity.create({
                  type: 'user.paymentMethod.created',
                  UserId: paymentMethod.CreatedByUserId,
                  CollectiveId: paymentMethod.CollectiveId,
                  data: {
                    paymentMethod: pm.minimal,
                  },
                });
              })

              // clean any old payment methods attached to this host collective
              .then(() =>
                models.PaymentMethod.findAll({
                  where: {
                    service: 'paypal',
                    type: 'adaptive',
                    CollectiveId: paymentMethod.CollectiveId,
                    id: { [Op.ne]: paymentMethod.id },
                  },
                }),
              )

              // TODO: Call paypal to cancel preapproval keys before marking as deleted.
              .then(oldPMs => oldPMs && oldPMs.map(pm => pm.destroy()))

              .then(() => {
                const redirect = `${paymentMethod.data.redirect}?status=success&service=paypal`;
                return res.redirect(redirect);
              })
          );
        })
        .catch(next);
    },

    /**
     * Get preapproval key details
     */
    verify: async (req, res, next) => {
      const pm = await models.PaymentMethod.findOne({
        where: {
          service: 'paypal',
          type: 'adaptive',
          token: req.query.preapprovalKey,
        },
        order: [['createdAt', 'DESC']],
      });
      if (!pm) {
        return next(
          new errors.BadRequest(`No paymentMethod found with this preapproval key: ${req.query.preapprovalKey}`),
        );
      }
      if (!req.remoteUser.isAdmin(pm.CollectiveId)) {
        return next(
          new errors.Unauthorized(
            'You are not authorized to verify a payment method of a collective that you are not an admin of',
          ),
        );
      }
      const updatedPaymentMethod = await getPreapprovalDetailsAndUpdatePaymentMethod(pm);
      return res.json(updatedPaymentMethod.info);
    },

    updateBalance: async paymentMethod => {
      return await getPreapprovalDetailsAndUpdatePaymentMethod(paymentMethod);
    },

    getBalance: async paymentMethod => {
      return {
        amount: get(paymentMethod, 'data.balance'),
        currency: get(paymentMethod, 'data.currency'),
      };
    },
  },
};
