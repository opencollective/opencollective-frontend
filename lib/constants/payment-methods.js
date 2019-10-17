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
  VIRTUAL_CARD: 'virtualcard',
  COLLECTIVE: 'collective',
};

const matchPm = (pm, service, type) => {
  return pm && pm.service === service && pm.type === type;
};

/** Returns true if the given payment method is a prepaid */
export const isPrepaid = pm => {
  return matchPm(pm, PaymentMethodService.OPEN_COLLECTIVE, PaymentMethodType.PREPAID);
};
