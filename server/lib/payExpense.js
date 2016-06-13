const config = require('config');
const Promise = require('bluebird');
const uuid = require('node-uuid');

module.exports = app => {
  const services = {
    paypal: (group, expense, email, preapprovalKey) => {
      var uri = `/groups/${group.id}/expenses/${expense.id}/paykey/`;
      var baseUrl = config.host.webapp + uri;
      var amount = expense.amount/100;
      var payload = {
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

      return Promise.promisify(app.paypalAdaptive.pay, {context: app.paypalAdaptive})(payload);
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
