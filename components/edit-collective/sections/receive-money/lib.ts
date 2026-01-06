import type { CustomPaymentProvider } from './EditCustomPaymentMethodDialog';

export const updateCustomPaymentMethods = (
  existingProviders: CustomPaymentProvider[],
  type: CustomPaymentProvider['type'],
  newProviders: CustomPaymentProvider[],
) => {
  let bankProviders: CustomPaymentProvider[] = [];
  let otherProviders: CustomPaymentProvider[] = [];
  if (type === 'BANK_TRANSFER') {
    bankProviders = newProviders;
    otherProviders = existingProviders ? existingProviders.filter(p => p.type !== 'BANK_TRANSFER') : [];
  } else {
    bankProviders = existingProviders ? existingProviders.filter(p => p.type === 'BANK_TRANSFER') : [];
    otherProviders = newProviders;
  }

  return [...bankProviders, ...otherProviders];
};
