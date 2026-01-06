import { type CustomPaymentProvider, CustomPaymentProviderType } from "@/lib/graphql/types/v2/schema";

export const updateCustomPaymentMethods = (
  existingProviders: CustomPaymentProvider[],
  type: CustomPaymentProvider['type'],
  newProviders: CustomPaymentProvider[],
) => {
  let bankProviders: CustomPaymentProvider[] = [];
  let otherProviders: CustomPaymentProvider[] = [];
  if (type === 'BANK_TRANSFER') {
    bankProviders = newProviders;
    otherProviders = existingProviders ? existingProviders.filter(p => p.type !== CustomPaymentProviderType.BANK_TRANSFER) : [];
  } else {
    bankProviders = existingProviders ? existingProviders.filter(p => p.type === CustomPaymentProviderType.BANK_TRANSFER) : [];
    otherProviders = newProviders;
  }

  return [...bankProviders, ...otherProviders];
};
