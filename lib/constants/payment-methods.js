export const PaymentMethodService = {
  OPEN_COLLECTIVE: 'opencollective',
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
};

export const PaymentMethodType = {
  PREPAID: 'prepaid',
  PAYMENT: 'payment',
  ADAPTIVE: 'adaptive',
  CREDIT_CARD: 'creditcard',
  GIFT_CARD: 'giftcard',
  COLLECTIVE: 'collective',
  ALIPAY: 'alipay',
};

export const GQLV2_PAYMENT_METHOD_SERVICES = {
  OPEN_COLLECTIVE: 'OPEN_COLLECTIVE',
  PAYPAL: 'PAYPAL',
  STRIPE: 'STRIPE',
};

export const GQLV2_PAYMENT_METHOD_TYPES = {
  CREDIT_CARD: 'CREDIT_CARD',
  PAYPAL: 'PAYPAL',
  BANK_TRANSFER: 'BANK_TRANSFER',
  GIFT_CARD: 'GIFT_CARD',
  PREPAID_BUDGET: 'PREPAID_BUDGET',
  ACCOUNT_BALANCE: 'ACCOUNT_BALANCE',
  ALIPAY: 'ALIPAY',
};

const matchPm = (pm, service, type) => {
  return pm && pm.service === service && pm.type === type;
};

/** Returns true if the given payment method is a prepaid */
export const isPrepaid = pm => {
  return matchPm(pm, PaymentMethodService.OPEN_COLLECTIVE, PaymentMethodType.PREPAID);
};

/** Returns payment methods with recurring payment support **/
export const ProvidersWithRecurringPaymentSupport = [
  GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD,
  GQLV2_PAYMENT_METHOD_TYPES.PAYPAL,
  GQLV2_PAYMENT_METHOD_TYPES.ACCOUNT_BALANCE,
];
