import Paypal from 'paypal-adaptive';
import config from 'config';
import Promise from 'bluebird';
import { get } from 'lodash';

const paypalAdaptiveClient = new Paypal({
  userId: config.paypal.classic.userId,
  password: config.paypal.classic.password,
  signature: config.paypal.classic.signature,
  appId: config.paypal.classic.appId,
  sandbox: config.env !== 'production',
});

const paypalAdaptive = {};

paypalAdaptive.callPaypal = (endpointName, payload) => {
  // Needs to be included in every call to PayPal
  const requestEnvelope = {
    errorLanguage: 'en_US',
    detailLevel: 'ReturnAll',
  };

  // Note you can't use Promise.promisify because error details are in the response,
  // not always in the err
  console.log(`Paypal ${endpointName} payload: ${JSON.stringify(payload)}`); // leave this in permanently
  return new Promise((resolve, reject) => {
    paypalAdaptiveClient[endpointName](Object.assign({}, payload, { requestEnvelope }), (err, res) => {
      console.log(`Paypal ${endpointName} response: ${JSON.stringify(res)}`); // leave this in permanently
      if (get(res, 'responseEnvelope.ack') === 'Failure') {
        if (res.error[0].errorId === '579024') {
          return reject(
            new Error(
              `Your PayPal pre-approval has expired, please reconnect your account by clicking on 'Refill Balance'.`,
            ),
          );
        } else {
          return reject(new Error(`PayPal error: ${res.error[0].message} (error id: ${res.error[0].errorId})`));
        }
      }
      if (err) {
        console.log(`Paypal ${endpointName} error: ${JSON.stringify(err)}`); // leave this in permanently
        if (err.code === 'ENOTFOUND' && err.syscall === 'getaddrinfo') {
          return reject(new Error(`Unable to reach ${err.hostname}`));
        }
        const errormsg = get(res, 'error[0].message') || JSON.stringify(err); // error details are included in the response, sometimes sigh.
        return reject(new Error(errormsg));
      }
      resolve(res);
    });
  });
};

paypalAdaptive.pay = payload => paypalAdaptive.callPaypal('pay', payload);
paypalAdaptive.executePayment = payKey => paypalAdaptive.callPaypal('executePayment', { payKey });
paypalAdaptive.preapproval = payload => paypalAdaptive.callPaypal('preapproval', payload);
paypalAdaptive.preapprovalDetails = preapprovalKey =>
  paypalAdaptive.callPaypal('preapprovalDetails', { preapprovalKey });

export default paypalAdaptive;
