const config = require('config');
const Promise = require('bluebird');
const uuid = require('node-uuid');

module.exports = app => {
  const services = {
    paypal: (group, expense, email, preapprovalKey) => {
      const uri = `/groups/${group.id}/expenses/${expense.id}/paykey/`;
      const baseUrl = config.host.webapp + uri;
      const amount = expense.amount/100;
      const payload = {
        requestEnvelope: {
          errorLanguage: 'en_US',
          detailLevel: 'ReturnAll'
        },
        actionType: 'PAY',
        // TODO does PayPal accept all the currencies that we support in our expenses?
        currencyCode: expense.currency,
        feesPayer: 'SENDER',
        memo: `Reimbursement from ${group.name}: ${expense.description}`,
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

      return new Promise((resolve, reject) => {
        app.paypalAdaptive.pay(payload, (err, res) => {
          if (err) {
            console.log("PayPal payment error: ", err);
            console.log("PayPal response: ", res);
            if (res.error && res.error[0] && res.error[0].parameter) {
              console.log("PayPal error.parameter: ", res.error[0].parameter); // this'll give us more details on the error
            }
            console.log("PayPal payment error: ")
            return reject(new Error(res.error[0].message));
          }
          resolve(res);
        });
      });
    }
  };

  return service => {
    const s = services[service];
    if (!s) {
      throw new errors.NotImplemented('This service is not implemented yet for payment.');
    }
    return s;
  };
};
