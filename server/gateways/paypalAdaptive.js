import Paypal from 'paypal-adaptive';
import config from 'config';
import Promise from 'bluebird';

const paypalAdaptiveClient = new Paypal({
  userId: config.paypal.classic.userId,
  password: config.paypal.classic.password,
  signature: config.paypal.classic.signature,
  appId: config.paypal.classic.appId,
  sandbox: config.env !== 'production'
});


const callPaypal = (endpointName, payload) => {

  // Needs to be included in every call to PayPal
  const requestEnvelope = {
    errorLanguage: 'en_US',
    detailLevel: 'ReturnAll'
  };

  // Note you can't use Promise.promisify because error details are in the response,
  // not always in the err

  return new Promise((resolve, reject) => {
    paypalAdaptiveClient[endpointName](Object.assign({}, payload, { requestEnvelope }), (err, res) => {
      console.log(`Paypal ${endpointName} response: ${JSON.stringify(res)}`); // leave this in permanently
      if (err) {
        console.log(`Paypal ${endpointName} error: ${JSON.stringify(err)}`);
        return reject(new Error(res.error[0].message)); // error details are included in the response. sigh.
      }
      resolve(res);
    });
  });
}

export const pay = (payload) => callPaypal('pay', payload);
export const executePayment = (payKey) => callPaypal('executePayment', { payKey });
export const getPreapproval = (payload) => callPaypal('preapproval', payload);
export const getPreapprovalDetails = (preapprovalKey) => callPaypal('preapprovalDetails', { preapprovalKey });