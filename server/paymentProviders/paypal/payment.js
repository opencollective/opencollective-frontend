import config from 'config';

import models from '../../models';
import roles from '../../constants/roles';

import * as constants from '../../constants/transactions';
import * as libpayments from '../../lib/payments';

/** Build an URL for the PayPal API */
export function paypalUrl(path) {
  if (path.startsWith('/')) throw new Error("Please don't use absolute paths");
  const baseUrl = config.paypal.payment.environment === 'sandbox'
    ? 'https://api.sandbox.paypal.com/v1/'
    : 'https://api.paypal.com/v1/';
  return (new URL(baseUrl + path)).toString();
}

/** Exchange clientid and secretid by an auth token with PayPal API */
export async function retrieveOAuthToken() {
  const { clientId, clientSecret } = config.paypal.payment;
  const url = paypalUrl('oauth2/token');
  const body = 'grant_type=client_credentials';
  /* The OAuth token entrypoint uses Basic HTTP Auth */
  const authStr = `${clientId}:${clientSecret}`;
  const basicAuth = Buffer.from(authStr).toString('base64');
  const headers = { Authorization: `Basic ${basicAuth}`};
  /* Execute the request and unpack the token */
  const response = await fetch(url, { method: 'post', body, headers });
  const jsonOutput = await response.json();
  return jsonOutput.access_token;
}

/** Assemble POST requests for communicating with PayPal API */
export async function paypalRequest(urlPath, body) {
  const url = paypalUrl(urlPath);
  const token = await retrieveOAuthToken();
  const params = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  const result = await fetch(url, params);
  if (!result.ok) throw new Error(result.statusText);
  return result.json();
}

/** Create a new payment object in the PayPal API */
export async function createPayment(req, res) {
  const { amount, currency } = req.body;
  if (!amount || !currency) throw new Error("Amount & Currency are required");
  const paymentParams = {
    intent: 'sale',
    payer: { payment_method: 'paypal' },
    transactions: [{ amount: { total: amount, currency } }],
    /* The values bellow are required by the PayPal API but they're
       not really used so they were just filled in with something
       reasonable. */
    redirect_urls: {
      return_url: 'https://opencollective.com',
      cancel_url: 'https://opencollective.com'
    }
  };
  const payment = await paypalRequest('payments/payment', paymentParams);
  return res.json({ id: payment.id });
}

/** Execute an already created payment */
export async function executePayment(order) {
  const { paymentID, payerID } = order.paymentMethod.data;
  return paypalRequest(`payments/payment/${paymentID}/execute`, { payer_id: payerID });
}

/** Create transaction in our database to reflect a PayPal charge */
export async function createTransaction(order, paymentInfo) {
  /* The `* 100` in the next lines convert from PayPal format in
     dollars to Open Collective format in cents */
  const amountFromPayPal = paymentInfo.transactions.map(
    t => parseFloat(t.amount.total)) * 100;
  const paypalFee = paymentInfo.transactions.map(
    t => t.related_resources.map(
      r => parseFloat(r.sale.transaction_fee.value))) * 100;
  const currencyFromPayPal = paymentInfo.transactions.map(
    t => t.amount.currency)[0];

  const hostFeeInHostCurrency = libpayments.calcFee(
    amountFromPayPal,
    order.collective.hostFeePercent);
  const platformFeeInHostCurrency = libpayments.calcFee(
    amountFromPayPal,
    constants.OC_FEE_PERCENT);

  const payload = {
    CreatedByUserId: order.createdByUser.id,
    FromCollectiveId: order.FromCollectiveId,
    CollectiveId: order.collective.id,
    PaymentMethodId: order.paymentMethod.id
  };
  payload.transaction = {
    type: constants.type.CREDIT,
    OrderId: order.id,
    amount: order.totalAmount,
    currency: order.currency,
    hostCurrency: currencyFromPayPal,
    amountInHostCurrency: amountFromPayPal,
    hostCurrencyFxRate: order.totalAmount / amountFromPayPal,
    hostFeeInHostCurrency,
    platformFeeInHostCurrency,
    paymentProcessorFeeInHostCurrency: paypalFee,
    description: order.description,
    data: paymentInfo,
  };
  return models.Transaction.createFromPayload(payload);
}

/** Add user that just donated as a backer of the collective */
export async function addUserToCollective(order) {
  const userId = order.createdByUser.id;
  const donorInfo = { id: userId, CollectiveId: order.FromCollectiveId };
  const tierInfo = { CreatedByUserId: userId, TierId: order.TierId };
  return order.collective.findOrAddUserWithRole(donorInfo, roles.BACKER, tierInfo);
}

/** Process order in paypal and create transactions in our db */
export async function processOrder(order) {
  const paymentInfo = await executePayment(order);
  const transaction = await createTransaction(order, paymentInfo);
  await addUserToCollective(order);
  await order.update({ processedAt: new Date() });
  await order.paymentMethod.update({ confirmedAt: new Date });
  return transaction;
}

/* Interface expected for a payment method */
export default {
  features: {
    recurring: true,
  },
  processOrder,
};
