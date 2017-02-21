import config from 'config';
import uuid from 'node-uuid';
import errors from './errors';
import paypalAdaptive from '../gateways/paypalAdaptive';

const services = {
  paypal: (group, expense, email, preapprovalKey) => {
    const uri = `/groups/${group.id}/expenses/${expense.id}/paykey/`;
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
      memo: `Reimbursement from ${group.name}: ${expense.title}`,
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
  }
};

export default service => {
  const s = services[service];
  if (!s) {
    throw new errors.NotImplemented('This service is not implemented yet for payment.');
  }
  return s;
};
