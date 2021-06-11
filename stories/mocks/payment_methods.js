export const creditCard = {
  id: 8771,
  uuid: 'ce4e0885-ebb4-4e1b-b644-4fa009370300',
  name: '4444',
  data: {
    expMonth: 2,
    expYear: 2022,
    brand: 'MasterCard',
    country: 'US',
  },
  monthlyLimitPerMember: null,
  service: 'stripe',
  type: 'creditcard',
  balance: 10000000,
  currency: 'USD',
  expiryDate: null,
};

export const paypal = {
  id: 9999,
  uuid: 'ce4e0xxx-ebb4-4e1b-b644-4fa009370300',
  name: 'Paypal',
  data: {
    paymentToken: 'EC-xxxxxxxxxxxx',
    orderID: 'EC-xxxxxxxxxxxxxxx',
    payerID: 'XXXXXXXXXXXXXX',
    paymentID: 'PAY-XXXXXXXXXXXXXX',
    intent: 'sale',
    returnUrl:
      'https://opencollective.com/?paymentId=PAY-XXXXXXXXXXXXXX&token=EC-XXXXXXXXXXXXXX&PayerID=XXXXXXXXXXXXXX',
  },
  monthlyLimitPerMember: null,
  service: 'paypal',
  type: 'payment',
  balance: 10000000,
  currency: 'USD',
  expiryDate: null,
};

export const virtualCard = {
  id: 8783,
  uuid: '493eb5de-905f-4f9a-a11e-668bd19d8750',
  name: '$100 Gift Card from New Collective',
  data: null,
  monthlyLimitPerMember: null,
  service: 'opencollective',
  type: 'virtualcard',
  balance: 2300,
  currency: 'USD',
  expiryDate: 'Sun Mar 03 2019 13:10:53 GMT+0100 (Central European Standard Time)',
};

export default [creditCard, virtualCard];
