import paypalAdaptive from './adaptiveGateway';
import { get, isNil } from 'lodash';
import config from 'config';
import { v1 as uuid } from 'uuid';
import logger from '../../lib/logger';
import errors from '../../lib/errors';

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

  const balance = parseFloat(response.maxTotalAmountOfAllPayments) - parseFloat(response.curPaymentsAmount);
  const balanceInCents = Math.trunc(balance * 100);

  const data = {
    redirect: paymentMethod.data.redirect,
    details: response,
    balance: balanceInCents,
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
  features: {
    recurring: false,
    paymentMethod: true, // creates a payment method that can be used to pay up to $2,000 USD or equivalent
  },

  fees: async ({ amount, currency, host }) => {
    if (host.currency === currency) {
      /*
        Paypal fees can vary from 2.9% + $0.30 to as much as 5% (maybe higher)
        with 2.9%, we saw a collective go in negative. Changing minimum to 3.9% to
        reduce risk of negative balance (and taking on some risk of an expense not
        able to be paid out)
       */
      return 0.039 * amount + 30;
    } else {
      return 0.05 * amount + 30;
    }
  },

  pay: async (collective, expense, email, preapprovalKey) => {
    const uri = `/${collective.slug}/expenses/${expense.id}`;
    const expenseUrl = config.host.website + uri;
    const amount = expense.amount / 100;
    const payload = {
      // Note: if we change this to 'PAY', payment will complete in one step
      // but we won't get any info on fees or conversion rates.
      // By creating payment, we get that info in the first response.
      actionType: 'CREATE',
      // TODO does PayPal accept all the currencies that we support in our expenses?
      currencyCode: expense.currency,
      feesPayer: 'SENDER',
      memo: `Reimbursement from ${collective.name}: ${expense.description}`,
      trackingId: [uuid().substr(0, 8), expense.id].join(':'),
      preapprovalKey,
      returnUrl: `${expenseUrl}?result=success&service=paypal`,
      cancelUrl: `${expenseUrl}?result=cancel&service=paypal`,
      receiverList: {
        receiver: [
          {
            email,
            amount,
            paymentType: 'SERVICE',
          },
        ],
      },
    };
    const createPaymentResponse = await paypalAdaptive.pay(payload);
    const executePaymentResponse = await paypalAdaptive.executePayment(createPaymentResponse.payKey);
    return { createPaymentResponse, executePaymentResponse };
  },

  // Returns the balance in the currency of the paymentMethod
  getBalance: async paymentMethod => {
    try {
      // If balance is already available for the PM
      const balance = get(paymentMethod, 'data.balance');
      if (!isNil(balance)) {
        return { amount: Math.trunc(balance), currency: paymentMethod.currency };
      }

      // Otherwise we fetch is from PayPal API
      const updatedPM = await getPreapprovalDetailsAndUpdatePaymentMethod(paymentMethod);
      return { amount: updatedPM.data.balance, currency: updatedPM.currency };
    } catch (e) {
      logger.error('getBalance for PayPal pre-approval failed', e);
      return { amount: 0, currency: paymentMethod.currency };
    }
  },

  updateBalance: async paymentMethod => {
    return await getPreapprovalDetailsAndUpdatePaymentMethod(paymentMethod);
  },
};
